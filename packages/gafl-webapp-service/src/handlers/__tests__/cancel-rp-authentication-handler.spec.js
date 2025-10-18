import handler from '../cancel-rp-authentication-handler'
import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../uri.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import GetDataRedirect from '../../handlers/get-data-redirect.js'

jest.mock('../../processors/uri-helper.js')
jest.mock('@defra-fish/connectors-lib')
jest.mock('../../processors/renewals-write-cache.js', () => ({
  setUpCacheFromAuthenticationResult: jest.fn().mockResolvedValue(undefined),
  setUpPayloads: jest.fn().mockResolvedValue(undefined)
}))
jest.mock('@defra-fish/business-rules-lib', () => ({
  validation: {
    contact: {
      createBirthDateValidator: () => ({ validateAsync: async () => '1970-01-01' }),
      createOverseasPostcodeValidator: () => ({ validateAsync: async () => 'AA1 1AA' })
    }
  }
}))
jest.mock('../../uri.js', () => ({
  CANCEL_RP_IDENTIFY: { page: 'cancel-rp-identify page', uri: Symbol('cancel-rp-identify-uri') },
  CANCEL_RP_DETAILS: { uri: Symbol('cancel-rp-details-uri') }
}))

const getRequest = (payloadOverride = {}) => {
  const page = {
    getCurrentPermission: jest.fn().mockResolvedValue({
      payload: {
        referenceNumber: 'ABC123',
        'date-of-birth-day': '01',
        'date-of-birth-month': '01',
        'date-of-birth-year': '1970',
        postcode: 'AA1 1AA',
        ...payloadOverride
      }
    }),
    setCurrentPermission: jest.fn()
  }
  const status = {
    getCurrentPermission: jest.fn().mockResolvedValue({}),
    setCurrentPermission: jest.fn()
  }
  const helpers = { page, status }
  const cache = () => ({ helpers })
  return { cache }
}

const getH = () => ({
  redirectWithLanguageCode: jest.fn().mockReturnValue('redirected')
})

describe('Cancel RP Authentication Handler', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Successful authentication', () => {
    let request, h, result
    beforeEach(async () => {
      salesApi.authenticate.mockResolvedValueOnce({ permission: { id: 'perm-id' } })
      request = getRequest()
      h = getH()
      result = await handler(request, h)
    })

    it('returns the redirect result', () => {
      expect(result).toBe('redirected')
    })

    it('redirects to details', () => {
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_DETAILS.uri)
    })

    it('marks status as authorised', () => {
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith({ authentication: { authorised: true } })
    })
  })

  describe('Unsuccessful authentication', () => {
    let request, h, errorCaught
    beforeEach(async () => {
      salesApi.authenticate.mockResolvedValueOnce(null)
      addLanguageCodeToUri.mockReturnValueOnce('decorated-identify-uri')
      request = getRequest()
      h = getH()
      try {
        await handler(request, h)
      } catch (e) {
        errorCaught = e
      }
    })

    it('throws GetDataRedirect', () => {
      expect(errorCaught).toBeInstanceOf(GetDataRedirect)
    })

    it('sets page cache error and preserves payload', () => {
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          error: { referenceNumber: 'not-found' }
        })
      )
    })

    it('marks status as unauthorised', () => {
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ authentication: { authorised: false } })
      )
    })
  })

  it('uses referenceNumber from status when payload is missing', async () => {
    salesApi.authenticate.mockResolvedValueOnce({ permission: { id: 'perm-id' } })
    const request = getRequest({ referenceNumber: undefined })
    request.cache().helpers.status.getCurrentPermission.mockResolvedValueOnce({
      referenceNumber: 'A1B2C3'
    })
    const h = getH()
    await handler(request, h)
    expect(salesApi.authenticate).toHaveBeenCalledWith('A1B2C3', expect.anything(), expect.anything())
  })
})

import handler from '../cancel-rp-authentication-handler'
import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../uri.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'

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
jest.mock('../../processors/recurring-payments-write-cache.js')

const getSampleRequest = (payloadOverride = {}) => {
  const getCurrentPermission = jest.fn(async () => ({}))
  const setCurrentPermission = jest.fn()

  return {
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: jest.fn(async () => ({
            payload: {
              referenceNumber: 'ABC123',
              'date-of-birth-day': '01',
              'date-of-birth-month': '01',
              'date-of-birth-year': '1970',
              postcode: 'AA1 1AA',
              ...payloadOverride
            }
          })),
          setCurrentPermission
        },
        status: {
          getCurrentPermission,
          setCurrentPermission
        }
      }
    })
  }
}

const getSampleResponseTooklkit = () => ({
  redirectWithLanguageCode: jest.fn().mockReturnValue('redirected')
})

const invokeHandlerWithMocks = async ({ salesApiResponse, decoratedIdentifyUri } = {}) => {
  if (typeof salesApiResponse !== 'undefined') {
    salesApi.authenticateRecurringPayment.mockResolvedValueOnce(salesApiResponse)
  }
  if (decoratedIdentifyUri) {
    addLanguageCodeToUri.mockReturnValueOnce(decoratedIdentifyUri)
  }
  const request = getSampleRequest()
  const h = getSampleResponseTooklkit()
  if (decoratedIdentifyUri) {
    h.redirect = jest.fn().mockReturnValue('redirect-response')
  }
  const result = await handler(request, h)
  return { request, h, result }
}

const mockSuccessResponse = () => ({
  permission: { id: 'perm-id' },
  recurringPayment: { id: 'rcp-id', status: 0, cancelledDate: null }
})

describe('Cancel RP Authentication Handler', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('Successful authentication', () => {
    it('returns the redirect result', async () => {
      const { result } = await invokeHandlerWithMocks({
        salesApiResponse: mockSuccessResponse()
      })
      expect(result).toBe('redirected')
    })

    it('redirects to details', async () => {
      const { h } = await invokeHandlerWithMocks({
        salesApiResponse: mockSuccessResponse()
      })
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_DETAILS.uri)
    })

    it('marks status as authorised', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: mockSuccessResponse()
      })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith({ authentication: { authorised: true } })
    })
  })

  describe('Unsuccessful authentication - no match', () => {
    it('redirects to the decorated identify URI', async () => {
      const { h } = await invokeHandlerWithMocks({ salesApiResponse: null, decoratedIdentifyUri: 'decorated-identify-uri' })
      expect(h.redirect).toHaveBeenCalledWith('decorated-identify-uri')
    })

    it('sets page cache error and preserves payload', async () => {
      const { request } = await invokeHandlerWithMocks({ salesApiResponse: null, decoratedIdentifyUri: 'decorated-identify-uri' })
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          error: { referenceNumber: 'not-found' }
        })
      )
    })

    it('marks status as unauthorised', async () => {
      const { request } = await invokeHandlerWithMocks({ salesApiResponse: null, decoratedIdentifyUri: 'decorated-identify-uri' })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ authentication: { authorised: false } })
      )
    })
  })

  describe('Unsuccessful authentication - no recurring payment agreement', () => {
    it('redirects to the decorated identify URI', async () => {
      const { h } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: null },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(h.redirect).toHaveBeenCalledWith('decorated-identify-uri')
    })

    it('sets page cache error for no RCP setup', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: null },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          error: { recurringPayment: 'not-set-up' }
        })
      )
    })

    it('marks status as unauthorised', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: null },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ authentication: { authorised: false } })
      )
    })
  })

  describe('Unsuccessful authentication - RCP cancelled', () => {
    it('redirects to the decorated identify URI', async () => {
      const { h } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(h.redirect).toHaveBeenCalledWith('decorated-identify-uri')
    })

    it('sets page cache error for RCP cancelled', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          error: { recurringPayment: 'rcp-cancelled' }
        })
      )
    })

    it('marks status as unauthorised', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ authentication: { authorised: false } })
      )
    })
  })

  it('uses referenceNumber from status when payload is missing', async () => {
    salesApi.authenticateRecurringPayment.mockResolvedValueOnce({
      permission: { id: 'perm-id' },
      recurringPayment: { id: 'rcp-id', status: 0, cancelledDate: null }
    })
    const request = getSampleRequest({ referenceNumber: undefined })
    request.cache().helpers.status.getCurrentPermission.mockReturnValueOnce({
      referenceNumber: 'A1B2C3'
    })
    const h = getSampleResponseTooklkit()
    await handler(request, h)
    expect(salesApi.authenticateRecurringPayment).toHaveBeenCalledWith('A1B2C3', expect.anything(), expect.anything())
  })
})

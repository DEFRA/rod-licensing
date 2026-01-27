import handler from '../cancel-recurring-payment-authentication-handler'
import {
  CANCEL_RP_IDENTIFY,
  CANCEL_RP_DETAILS,
  CANCEL_RP_AGREEMENT_NOT_FOUND,
  CANCEL_RP_ALREADY_CANCELLED,
  CANCEL_RP_LICENCE_NOT_FOUND
} from '../../uri.js'
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
  CANCEL_RP_DETAILS: { uri: Symbol('cancel-rp-details-uri') },
  CANCEL_RP_AGREEMENT_NOT_FOUND: { uri: Symbol('cancel-rp-agreement-not-found-uri') },
  CANCEL_RP_ALREADY_CANCELLED: { uri: Symbol('cancel-rp-already-cancelled-uri ') },
  CANCEL_RP_LICENCE_NOT_FOUND: { uri: Symbol('cancel-rp-licence-not-found-uri') }
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

const getSampleResponseToolkit = () => ({
  redirectWithLanguageCode: jest.fn(() => 'redirected')
})

const invokeHandlerWithMocks = async ({ h = getSampleResponseToolkit(), salesApiResponse } = {}) => {
  if (salesApiResponse) {
    salesApi.authenticateRecurringPayment.mockResolvedValueOnce(salesApiResponse)
  }
  const request = getSampleRequest()
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
    it('redirects to the CANCEL_RP_LICENCE_NOT_FOUND.uri', async () => {
      const { h } = await invokeHandlerWithMocks({ salesApiResponse: null })
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_LICENCE_NOT_FOUND.uri)
    })

    it('returns value of redirect', async () => {
      const h = getSampleResponseToolkit()
      const redirectResult = Symbol('redirected')
      h.redirectWithLanguageCode.mockReturnValueOnce(redirectResult)
      const { result } = await invokeHandlerWithMocks({
        h,
        salesApiResponse: null
      })
      expect(result).toBe(redirectResult)
    })

    it('sets page cache error and preserves payload', async () => {
      const { request } = await invokeHandlerWithMocks({ salesApiResponse: null })
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          errorRedirect: true
        })
      )
    })

    it('marks status as unauthorised', async () => {
      const { request } = await invokeHandlerWithMocks({ salesApiResponse: null })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ authentication: { authorised: false } })
      )
    })

    it('sets currentPage to error page name', async () => {
      const { request } = await invokeHandlerWithMocks({ salesApiResponse: null })
      expect(request.cache().helpers.status.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({
          currentPage: CANCEL_RP_LICENCE_NOT_FOUND.page
        })
      )
    })
  })

  describe('Unsuccessful authentication - no recurring payment agreement', () => {
    it('redirects to the CANCEL_RP_AGREEMENT_NOT_FOUND.uri', async () => {
      const { h } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: null },
        decoratedIdentifyUri: 'decorated-identify-uri'
      })
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_AGREEMENT_NOT_FOUND.uri)
    })

    it('returns value of redirect', async () => {
      const h = getSampleResponseToolkit()
      const redirectResult = Symbol('redirected')
      h.redirectWithLanguageCode.mockReturnValueOnce(redirectResult)
      const { result } = await invokeHandlerWithMocks({
        h,
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: null }
      })
      expect(result).toBe(redirectResult)
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

  describe('Unsuccessful authentication - RCP already cancelled', () => {
    it('redirects to the CANCEL_RP_ALREADY_CANCELLED.uri', async () => {
      const { h } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } }
      })
      expect(h.redirectWithLanguageCode).toHaveBeenCalledWith(CANCEL_RP_ALREADY_CANCELLED.uri)
    })

    it('returns value of redirect', async () => {
      const h = getSampleResponseToolkit()
      const redirectResult = Symbol('redirected')
      h.redirectWithLanguageCode.mockReturnValueOnce(redirectResult)
      const { result } = await invokeHandlerWithMocks({
        h,
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } }
      })
      expect(result).toBe(redirectResult)
    })

    it('sets page cache for RCP already cancelled', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } }
      })
      expect(request.cache().helpers.page.setCurrentPermission).toHaveBeenCalledWith(
        CANCEL_RP_IDENTIFY.page,
        expect.objectContaining({
          payload: expect.any(Object),
          errorRedirect: true
        })
      )
    })

    it('marks status as unauthorised', async () => {
      const { request } = await invokeHandlerWithMocks({
        salesApiResponse: { permission: { id: 'perm-id' }, recurringPayment: { id: 'rcp-id', status: 1, cancelledDate: '2024-01-01' } }
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
    const h = getSampleResponseToolkit()
    await handler(request, h)
    expect(salesApi.authenticateRecurringPayment).toHaveBeenCalledWith('A1B2C3', expect.anything(), expect.anything())
  })
})

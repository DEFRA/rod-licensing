import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import { findByExample } from '@defra-fish/dynamics-lib'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'

jest.mock('@defra-fish/dynamics-lib', () => ({
  RecurringPayment: jest.fn().mockImplementation(() => ({})),
  findByExample: jest.fn()
}))

jest.mock('../../../../processors/licence-type-display.js', () => ({
  licenceTypeDisplay: jest.fn()
}))

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_DETAILS: { page: Symbol('cancel-rp-details-page'), uri: Symbol('cancel-rp-details-uri') },
  CANCEL_RP_CONFIRM: { uri: Symbol('cancel-rp-confirm-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')

describe('route', () => {
  beforeEach(jest.clearAllMocks)

  describe('pageRoute receives expected arguments', () => {
    const [[_v, _p, validator, completion, getData]] = pageRoute.mock.calls
    it('passes CANCEL_RP_DETAILS.page as the view name', () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          CANCEL_RP_DETAILS.page,
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything()
        )
      })
    })

    it('passes CANCEL_RP_DETAILS.uri as the path', () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          expect.anything(),
          CANCEL_RP_DETAILS.uri,
          expect.anything(),
          expect.anything(),
          expect.anything()
        )
      })
    })

    it('passes a function as the validator', () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.any(Function),
          expect.anything(),
          expect.anything()
        )
      })
    })

    it('passes a function to generate redirect location on completion', () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.any(Function),
          expect.anything()
        )
      })
    })

    it('passes a function to get the page data', () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.anything(),
          expect.any(Function)
        )
      })
    })
  })

  it('calls addLanguageCodeToUri with request object', () => {
    const sampleRequest = Symbol('sample request')
    completion(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, expect.anything())
  })

  it('calls addLanguageCodeToUri with CANCEL_RP_AUTHENTICATE uri', () => {
    completion({})
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_CONFIRM.uri)
  })

  it('returns the value of addLanguageCodeToUri', () => {
    const expectedCompletionRedirect = Symbol('expected-completion-redirect')
    addLanguageCodeToUri.mockReturnValueOnce(expectedCompletionRedirect)

    const completionRedirect = completion({})

    expect(completionRedirect).toBe(expectedCompletionRedirect)
  })

  const getSampleCatalog = () => ({
    rp_cancel_details_licence_holder: 'Licence holder',
    rp_cancel_details_licence_type: 'Licence type',
    rp_cancel_details_payment_card: 'Payment card',
    rp_cancel_details_last_purchased: 'Last purchased',
    rp_cancel_details_licence_valid_until: 'Valid until'
  })

  const createMockRequest = ({ permission, catalog = getSampleCatalog() } = {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: jest.fn().mockResolvedValue(permission)
        }
      }
    }),
    i18n: {
      getCatalog: () => catalog
    }
  })

  describe('getData', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('calls getCurrentPermission from cache helpers', async () => {
      const permission = { id: 'perm123' }
      const mockRequest = createMockRequest({ permission })

      await getData(mockRequest)

      expect(mockRequest.cache().helpers.status.getCurrentPermission).toHaveBeenCalled()
    })

    it('calls findByExample', async () => {
      const permission = { id: 'perm123' }
      const mockRequest = createMockRequest({ permission })
      findByExample.mockResolvedValue([])

      await getData(mockRequest)

      expect(findByExample).toHaveBeenCalledTimes(1)
    })

    it('creates a RecurringPayment with activePermission set', async () => {
      const permission = { id: 'perm123' }
      const mockRequest = createMockRequest({ permission })
      findByExample.mockResolvedValue([])

      await getData(mockRequest)

      const exampleArg = findByExample.mock.calls[0][0]
      expect(exampleArg.activePermission).toBe(permission.id)
    })

    it('returns summaryTable with expected data', async () => {
      const permission = {
        id: 'perm-001',
        referenceNumber: '9999',
        endDate: '01-01-2026',
        licensee: { firstName: 'John', lastName: 'Smith' }
      }

      const recurringPayment = { lastDigitsCardNumbers: '1234' }
      findByExample.mockResolvedValue([recurringPayment])

      const mssgs = {
        rp_cancel_details_licence_holder: 'Licence holder',
        rp_cancel_details_licence_type: 'Licence type',
        rp_cancel_details_payment_card: 'Payment card',
        rp_cancel_details_last_purchased: 'Last purchased',
        rp_cancel_details_licence_valid_until: 'Valid until'
      }

      licenceTypeDisplay.mockReturnValue('Salmon and sea trout')

      const mockRequest = createMockRequest({ permission, catalog: mssgs })

      const result = await getData(mockRequest)

      expect(result.summaryTable).toEqual([
        { key: { text: mssgs.rp_cancel_details_licence_holder }, value: { text: 'John Smith' } },
        { key: { text: mssgs.rp_cancel_details_licence_type }, value: { text: 'Salmon and sea trout' } },
        { key: { text: mssgs.rp_cancel_details_payment_card }, value: { text: '1234' } },
        { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: '9999' } },
        { key: { text: mssgs.rp_cancel_details_licence_valid_until }, value: { text: '01-01-2026' } }
      ])
    })

    it('handles case when no recurring payment is found', async () => {
      const permission = {
        id: 'perm-001',
        referenceNumber: '9999',
        endDate: '01-01-2026',
        licensee: { firstName: 'John', lastName: 'Smith' }
      }

      findByExample.mockResolvedValue([])

      licenceTypeDisplay.mockReturnValue('Salmon and sea trout')

      const mockRequest = createMockRequest({ permission, catalog: mssgs })

      const result = await getData(mockRequest)

      expect(result.summaryTable[2].value.text).toBeUndefined()
    })
  })
})

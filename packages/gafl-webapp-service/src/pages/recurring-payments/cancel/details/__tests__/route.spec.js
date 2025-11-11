import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { licenceTypeDisplay } from '../../../../../processors/licence-type-display.js'
import { getData } from '../route.js'

jest.mock('../../../../../processors/licence-type-display.js', () => ({
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
    it('should call the pageRoute with date-of-birth, /buy/date-of-birth, dateOfBirthValidator and nextPage', async () => {
      jest.isolateModules(() => {
        require('../route.js')
        expect(pageRoute).toHaveBeenCalledWith(
          CANCEL_RP_DETAILS.page,
          CANCEL_RP_DETAILS.uri,
          expect.any(Function),
          expect.any(Function),
          expect.any(Function)
        )
      })
    })
  })

  it('calls addLanguageCodeToUri with request object', async () => {
    jest.isolateModules(() => {
      require('../route.js')
    })
    const [[, , , completion]] = pageRoute.mock.calls
    const sampleRequest = Symbol('sample request')
    completion(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, expect.anything())
  })

  it('calls addLanguageCodeToUri with CANCEL_RP_AUTHENTICATE uri', () => {
    jest.isolateModules(() => {
      require('../route.js')
    })
    const [[, , , completion]] = pageRoute.mock.calls
    completion({})
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(expect.anything(), CANCEL_RP_CONFIRM.uri)
  })

  it('returns the value of addLanguageCodeToUri', () => {
    jest.isolateModules(() => {
      require('../route.js')
    })
    const [[, , , completion]] = pageRoute.mock.calls
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
        transaction: {
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

    it('returns request.i18n.getCatalog()', async () => {
      const permission = {
        referenceNumber: 'abc123',
        recurringPayment: {
          endDate: '01-01-2026',
          name: 'John Smith',
          lastDigitsCardNumbers: 1234
        }
      }

      const mssgs = {
        rp_cancel_details_licence_holder: 'Test licence holder',
        rp_cancel_details_licence_type: 'Test licence type',
        rp_cancel_details_payment_card: 'Test payment card',
        rp_cancel_details_last_purchased: 'Test last purchased',
        rp_cancel_details_licence_valid_until: 'Test valid until'
      }

      licenceTypeDisplay.mockReturnValue('Salmon and sea trout')

      const mockRequest = createMockRequest({ permission, catalog: mssgs })

      const result = await getData(mockRequest)

      expect(result.mssgs).toEqual(mssgs)
    })

    it('returns summaryTable with expected data', async () => {
      const permission = {
        referenceNumber: 'abc123',
        recurringPayment: {
          endDate: '01-01-2026',
          name: 'John Smith',
          lastDigitsCardNumbers: 1234
        }
      }

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
        { key: { text: mssgs.rp_cancel_details_payment_card }, value: { text: 1234 } },
        { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: 'abc123' } },
        { key: { text: mssgs.rp_cancel_details_licence_valid_until }, value: { text: '01-01-2026' } }
      ])
    })
  })
})

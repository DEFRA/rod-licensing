import pageRoute from '../../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { getData } from '../route.js'
import moment from 'moment-timezone'
import { cacheDateFormat, dateDisplayFormat } from '../../../../../processors/date-and-time-display.js'

jest.mock('../../../../../routes/page-route.js')
jest.mock('../../../../../uri.js', () => ({
  ...jest.requireActual('../../../../../uri.js'),
  CANCEL_RP_DETAILS: { page: Symbol('cancel-rp-details-page'), uri: Symbol('cancel-rp-details-uri') },
  CANCEL_RP_CONFIRM: { uri: Symbol('cancel-rp-confirm-uri') }
}))
jest.mock('../../../../../processors/uri-helper.js')
jest.mock('moment-timezone', () =>
  jest.fn(() => ({
    format: jest.fn()
  }))
)
jest.mock('../../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: Symbol('cache-date-format'),
  dateDisplayFormat: Symbol('date-display-format')
}))

describe('route', () => {
  beforeEach(jest.clearAllMocks)

  describe('pageRoute receives expected arguments', () => {
    it('should call the pageRoute with cancel-rp-details, /buy/cancel-recurring-payment/details, dateOfBirthValidator, nextPage and getData', async () => {
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
    rp_cancel_details_licence_valid_until: 'Valid until',
    licence_type_radio_trout_two_rod_payment_summary: 'Trout and coarse (up to 2 rods)',
    over_66: ' (over_66)'
  })

  const getSamplePermission = () => ({
    permission: {
      licensee: {
        firstName: 'John',
        lastName: 'Smith'
      },
      permit: {
        description: 'Salmon and sea trout',
        permitSubtype: { label: 'Trout and coarse' },
        numberOfRods: 2
      },
      concessions: [],
      endDate: '01-01-2026',
      referenceNumber: 'abc123'
    },
    recurringPayment: {
      lastDigitsCardNumbers: '1234'
    }
  })

  const createMockRequest = ({ currentPermission = getSamplePermission(), catalog = getSampleCatalog() } = {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: jest.fn().mockResolvedValue(currentPermission)
        }
      }
    }),
    i18n: {
      getCatalog: () => catalog
    },
    locale: Symbol('en-GB')
  })

  describe('getData', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('returns request.i18n.getCatalog()', async () => {
      const mssgs = getSampleCatalog()
      const mockRequest = createMockRequest({ catalog: mssgs })

      const result = await getData(mockRequest)

      expect(result.mssgs).toEqual(mssgs)
    })

    it('returns summaryTable with expected data', async () => {
      const mssgs = getSampleCatalog()
      const sampleData = getSamplePermission()
      const mockRequest = createMockRequest({ catalog: mssgs, currentPermission: sampleData })

      const sampleFormattedDate = '01-01-2026'
      moment.mockReturnValueOnce({
        format: () => sampleFormattedDate
      })

      const result = await getData(mockRequest)

      expect(result.summaryTable).toEqual([
        {
          key: { text: mssgs.rp_cancel_details_licence_holder },
          value: { text: `${sampleData.permission.licensee.firstName} ${sampleData.permission.licensee.lastName}` }
        },
        { key: { text: mssgs.rp_cancel_details_licence_type }, value: { text: mssgs.licence_type_radio_trout_two_rod_payment_summary } },
        {
          key: { text: mssgs.rp_cancel_details_payment_card },
          value: { text: `**** **** **** ${sampleData.recurringPayment.lastDigitsCardNumbers}` }
        },
        { key: { text: mssgs.rp_cancel_details_last_purchased }, value: { text: sampleData.permission.referenceNumber } },
        { key: { text: mssgs.rp_cancel_details_licence_valid_until }, value: { text: sampleFormattedDate } }
      ])
    })

    it.each([
      ['shows translated licence type with (over_66) for senior', [{ type: 'Senior' }], true],
      [
        'shows translated licence type with (over_66) for senior when disabled is also present',
        [{ type: 'Senior' }, { type: 'Disabled' }],
        true
      ],
      ['shows translated licence type without (over_66) when not senior', [], false]
    ])('%s', async (_desc, concessions, expectOver66) => {
      const mssgs = getSampleCatalog()

      const sampleData = getSamplePermission()
      sampleData.permission.concessions = concessions

      const mockRequest = createMockRequest({
        catalog: mssgs,
        currentPermission: sampleData
      })

      moment.mockReturnValueOnce({
        format: () => '01-01-2026'
      })

      const result = await getData(mockRequest)

      const licenceTypeRow = result.summaryTable.find(row => row.key.text === mssgs.rp_cancel_details_licence_type)

      expect(licenceTypeRow).toBeDefined()

      expect(licenceTypeRow.value.text).toContain(mssgs.licence_type_radio_trout_two_rod_payment_summary)

      if (expectOver66) {
        expect(licenceTypeRow.value.text).toContain('(over_66)')
      } else {
        expect(licenceTypeRow.value.text).not.toContain('(over_66)')
      }
    })

    it('passes cache date format and request locale to moment', async () => {
      const data = getSamplePermission()
      data.permission.endDate = Symbol('end-date')
      const mockRequest = createMockRequest({ currentPermission: data })

      await getData(mockRequest)

      expect(moment).toHaveBeenCalledWith(data.permission.endDate, cacheDateFormat, mockRequest.locale)
    })

    it('requests correct date format', async () => {
      const data = getSamplePermission()
      data.permission.endDate = Symbol('end-date')
      const mockRequest = createMockRequest({ currentPermission: data })
      const format = jest.fn()
      moment.mockReturnValueOnce({
        format
      })

      await getData(mockRequest)

      expect(format).toHaveBeenCalledWith(dateDisplayFormat)
    })
  })
})

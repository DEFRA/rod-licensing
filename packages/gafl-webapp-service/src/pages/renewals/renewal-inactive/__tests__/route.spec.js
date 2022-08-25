import { getData, getTitleAndBodyMessage } from '../route'
import { NEW_TRANSACTION } from '../../../../uri.js'
import { RENEWAL_ERROR_REASON } from '../../../../constants'
import moment from 'moment-timezone'

const dateTimeDisplayMock = jest.requireMock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: 'YYYY-MM-DD',
  dateDisplayFormat: 'D MMMM YYYY'
}))

const englishTranslations = {
  renewal_inactive_title_1: 'You are renewing this licence too early',
  renewal_inactive_title_2: 'The licence renewal has expired',
  renewal_inactive_title_3: 'You cannot renew an 8 day or 1 day licence',
  renewal_inactive_not_due_1: 'The licence ending in ',
  renewal_inactive_not_due_2: ' does not expire until ',
  renewal_inactive_has_expired_1: ' has expired on ',
  renewal_inactive_has_expired_2: ' and can no longer be renewed',
  renewal_inactive_not_annual_1: ' is not a 12 month licence and cannot be renewed.'
}

const welshTranslations = {
  renewal_inactive_title_1: 'You are renewing this licence too early',
  renewal_inactive_title_2: 'The licence renewal has expired',
  renewal_inactive_title_3: 'You cannot renew an 8 day or 1 day licence',
  renewal_inactive_not_due_1: 'The licence ending in ',
  renewal_inactive_not_due_2: ' does not expire until ',
  renewal_inactive_has_expired_1: ' has expired on ',
  renewal_inactive_has_expired_2: ' and can no longer be renewed',
  renewal_inactive_not_annual_1: ' is not a 12 month licence and cannot be renewed.'
}

jest.mock('moment-timezone')
const getMomentMockImpl = (overrides = {}) =>
  jest.fn(() => ({
    format: () => {},
    ...overrides
  }))

const mockStatusCacheGet = jest.fn()

const getMockRequest = (language, messages = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: mockStatusCacheGet
      }
    }
  }),
  i18n: {
    getCatalog: () => messages
  },
  locale: language
})

describe('renewal-inactive > route', () => {
  beforeEach(jest.clearAllMocks)
  describe('getData', () => {
    describe.each([
      [
        RENEWAL_ERROR_REASON.NOT_DUE,
        'renewal_inactive_not_due_1 abc-123 renewal_inactive_not_due_2 12th Never',
        { renewal_inactive_title_1: 'Renewal inactive title 1' },
        'Renewal inactive title 1'
      ],
      [
        RENEWAL_ERROR_REASON.EXPIRED,
        'renewal_inactive_not_due_1 abc-123 renewal_inactive_has_expired_1 12th Never renewal_inactive_has_expired_2',
        { renewal_inactive_title_2: 'Renewal inactive title 2' },
        'Renewal inactive title 2'
      ],
      [
        RENEWAL_ERROR_REASON.NOT_ANNUAL,
        'renewal_inactive_not_due_1 abc-123 renewal_inactive_not_annual_1',
        { renewal_inactive_title_3: 'Renewal inactive title 3' },
        'Renewal inactive title 3'
      ],
      ['', '', {}, '']
    ])('title and body message', (authReason, expectedBodyString, mssgOverrides, expectedTitle) => {
      const getMessages = (overrides = {}) => ({
        renewal_inactive_not_due_1: 'renewal_inactive_not_due_1 ',
        renewal_inactive_not_due_2: ' renewal_inactive_not_due_2 ',
        renewal_inactive_has_expired_1: ' renewal_inactive_has_expired_1 ',
        renewal_inactive_has_expired_2: ' renewal_inactive_has_expired_2',
        renewal_inactive_not_annual_1: ' renewal_inactive_not_annual_1',
        renewal_inactive_title_1: 'renewal_inactive_title_1',
        renewal_inactive_title_2: 'renewal_inactive_title_2',
        renewal_inactive_title_3: 'renewal_inactive_title_3',
        ...overrides
      })

      it('body message is as expected', async () => {
        moment.mockImplementation(
          getMomentMockImpl({
            format: () => '12th Never'
          })
        )
        mockStatusCacheGet.mockImplementationOnce(() => ({
          authentication: { reason: authReason },
          referenceNumber: 'abc-123'
        }))
        const { bodyMessage } = await getData(getMockRequest('en-gb', getMessages(mssgOverrides)))
        expect(bodyMessage).toEqual(expectedBodyString)
      })

      it('title is as expected', async () => {
        moment.mockImplementation(getMomentMockImpl())
        mockStatusCacheGet.mockImplementationOnce(() => ({
          authentication: { reason: authReason },
          referenceNumber: 'abc-123'
        }))
        const { title } = await getData(getMockRequest('en-gb', getMessages(mssgOverrides)))
        expect(title).toEqual(expectedTitle)
      })
    })

    it.each([
      [RENEWAL_ERROR_REASON.NOT_DUE, 'not-due'],
      [RENEWAL_ERROR_REASON.EXPIRED, 'expired'],
      [RENEWAL_ERROR_REASON.NOT_ANNUAL, 'not-annual']
    ])('should return the reason', async (reason, expected) => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { reason: reason }, referenceNumber: 'abc-123' }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(getMockRequest())
      expect(result.reason).toBe(expected)
    })

    it('should return the reason codes', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE },
        referenceNumber: 'ABC123'
      }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(getMockRequest())
      expect(result.reasonCodes).toBe(RENEWAL_ERROR_REASON)
    })

    it('should return the new transation uri', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: {} }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(getMockRequest())
      expect(result.uri.new).toBe(NEW_TRANSACTION.uri)
    })

    it.each([
      ['2020-12-13T23:59:59Z', 'ABV123'],
      ['2020-01-13T23:59:59Z', 'LKJ234'],
      ['2020-10-13T23:59:59Z', 'MHG356']
    ])('titleAndBodyMessage is result of moment().format()', async (endDate, referenceNumber) => {
      const formatSymbol = Symbol('formatResult').toString()
      moment.mockImplementation(
        getMomentMockImpl({
          format: () => formatSymbol
        })
      )

      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate },
        referenceNumber: referenceNumber
      }))

      const { ...titleAndBodyMessage } = await getData(getMockRequest('en-gb', englishTranslations))

      const { bodyMessage } = getTitleAndBodyMessage(englishTranslations, RENEWAL_ERROR_REASON.NOT_DUE, referenceNumber, formatSymbol)

      expect(titleAndBodyMessage.bodyMessage).toEqual(bodyMessage)
    })

    it('endDate is passed to moment', async () => {
      const endDate = Symbol('endDate')
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate },
        referenceNumber: 'ABC123'
      }))
      moment.mockImplementation(getMomentMockImpl())
      await getData(getMockRequest('en-gb'))
      expect(moment).toHaveBeenCalledWith(endDate, expect.any(String), expect.any(String))
    })

    it('cacheDateFormat being what is expected', async () => {
      const cacheSymbol = Symbol('cacheDate')
      dateTimeDisplayMock.cacheDateFormat = cacheSymbol
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate: '2020-12-13T23:59:59Z' },
        referenceNumber: 'ABC123'
      }))
      moment.mockImplementation(getMomentMockImpl())
      await getData(getMockRequest('en-gb'))
      expect(moment).toHaveBeenCalledWith(expect.any(String), cacheSymbol, expect.any(String))
    })

    it('locale is set on moment, to whatever the request.locale is', async () => {
      const language = Symbol('language')
      const format = jest.fn()
      moment.mockImplementation(getMomentMockImpl({ format }))
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate: '2020-12-13T23:59:59Z' },
        referenceNumber: 'ABC123'
      }))
      await getData(getMockRequest(language))
      expect(moment).toHaveBeenCalledWith(expect.any(String), expect.anything(), language)
    })

    it('dateDisplayFormat is passed to format', async () => {
      const dateDisplaySymbol = Symbol('dateDisplay')
      dateTimeDisplayMock.dateDisplayFormat = dateDisplaySymbol
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate: '2020-12-13T23:59:59Z' },
        referenceNumber: 'ABC123'
      }))
      const format = jest.fn()
      moment.mockImplementation(getMomentMockImpl({ format }))
      await getData(getMockRequest())
      expect(format).toHaveBeenCalledWith(dateDisplaySymbol)
    })
  })

  describe('getTitleAndBodyMessage', () => {
    it.each([
      [
        'The licence ending in ABC123 does not expire until 13 December 2020',
        RENEWAL_ERROR_REASON.NOT_DUE,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 has expired on 13 December 2020 and can no longer be renewed',
        RENEWAL_ERROR_REASON.EXPIRED,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 is not a 12 month licence and cannot be renewed.',
        RENEWAL_ERROR_REASON.NOT_ANNUAL,
        'ABC123',
        '13 December 2020',
        englishTranslations
      ],
      [
        'The licence ending in ABC123 does not expire until 13 December 2020',
        RENEWAL_ERROR_REASON.NOT_DUE,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ],
      [
        'The licence ending in ABC123 has expired on 13 December 2020 and can no longer be renewed',
        RENEWAL_ERROR_REASON.EXPIRED,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ],
      [
        'The licence ending in ABC123 is not a 12 month licence and cannot be renewed.',
        RENEWAL_ERROR_REASON.NOT_ANNUAL,
        'ABC123',
        '13 December 2020',
        welshTranslations
      ]
    ])('should return and object with bodyMessage as %s if the reason is %s', (expected, reason, referenceNumber, validTo, translation) => {
      const result = getTitleAndBodyMessage(translation, reason, referenceNumber, validTo)
      expect(result.bodyMessage).toBe(expected)
    })

    it.each([
      ['You are renewing this licence too early', RENEWAL_ERROR_REASON.NOT_DUE, englishTranslations],
      ['The licence renewal has expired', RENEWAL_ERROR_REASON.EXPIRED, englishTranslations],
      ['You cannot renew an 8 day or 1 day licence', RENEWAL_ERROR_REASON.NOT_ANNUAL, englishTranslations],
      ['You are renewing this licence too early', RENEWAL_ERROR_REASON.NOT_DUE, welshTranslations],
      ['The licence renewal has expired', RENEWAL_ERROR_REASON.EXPIRED, welshTranslations],
      ['You cannot renew an 8 day or 1 day licence', RENEWAL_ERROR_REASON.NOT_ANNUAL, welshTranslations]
    ])('should return and object with title as %s if the reason is %s', (expected, reason, translation) => {
      const result = getTitleAndBodyMessage(translation, reason, 'ABC123', '13 December 2020')
      expect(result.title).toBe(expected)
    })

    it('should return an object with bodyMessage and title as empty if no reason is provided', () => {
      const result = getTitleAndBodyMessage(englishTranslations, undefined, 'ABC123', '13 December 2020')
      expect(result.bodyMessage).toBe('')
      expect(result.title).toBe('')
    })
  })
})

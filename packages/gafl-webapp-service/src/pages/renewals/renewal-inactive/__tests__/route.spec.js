import { getData, getTitleAndBodyMessage } from '../route'
import { NEW_TRANSACTION } from '../../../../uri.js'
import { RENEWAL_ERROR_REASON } from '../../../../constants'
import moment from 'moment-timezone'
import englishTranslations from '../../../../locales/en.json'
import welshTranslations from '../../../../locales/cy.json'

const dateTimeDisplayMock = jest.requireMock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/date-and-time-display.js', () => ({
  cacheDateFormat: 'YYYY-MM-DD',
  dateDisplayFormat: 'D MMMM YYYY'
}))

jest.mock('moment-timezone')
const getMomentMockImpl = (overrides = {}) =>
  jest.fn(() => ({
    format: () => {},
    ...overrides
  }))

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

      const getMockRequest = (authReason, messages = getMessages()) => ({
        cache: () => ({
          helpers: {
            status: {
              getCurrentPermission: async () => ({
                referenceNumber: 'abc-123',
                authentication: {
                  endDate: '',
                  reason: authReason
                }
              })
            }
          }
        }),
        i18n: {
          getCatalog: () => messages
        },
        locale: 'en-gb'
      })

      it('body message is as expected', async () => {
        const mockRequest = getMockRequest(authReason)
        moment.mockImplementation(
          getMomentMockImpl({
            format: () => '12th Never'
          })
        )
        const { bodyMessage } = await getData(mockRequest)
        expect(bodyMessage).toEqual(expectedBodyString)
      })

      it('title is as expected', async () => {
        const mockRequest = getMockRequest(authReason, getMessages(mssgOverrides))
        moment.mockImplementation(getMomentMockImpl())
        const { title } = await getData(mockRequest)
        expect(title).toEqual(expectedTitle)
      })
    })

    const mockStatusCacheGet = jest.fn()

    const mockRequest = {
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet
          }
        }
      }),
      i18n: {
        getCatalog: jest.fn(() => englishTranslations)
      },
      locale: 'en-gb'
    }

    it.each([
      [RENEWAL_ERROR_REASON.NOT_DUE, 'not-due'],
      [RENEWAL_ERROR_REASON.EXPIRED, 'expired'],
      [RENEWAL_ERROR_REASON.NOT_ANNUAL, 'not-annual']
    ])('should return the reason', async (reason, expected) => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { reason: reason } }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(mockRequest)
      expect(result.reason).toBe(expected)
    })

    it('should return the reason codes', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE } }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(mockRequest)
      expect(result.reasonCodes).toBe(RENEWAL_ERROR_REASON)
    })

    it('should return the new transation uri', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: {} }))
      moment.mockImplementation(getMomentMockImpl())
      const result = await getData(mockRequest)
      expect(result.uri.new).toBe(NEW_TRANSACTION.uri)
    })

    it.each([
      ['2020-12-13T23:59:59Z', RENEWAL_ERROR_REASON.NOT_DUE, 'ABV123'],
      ['2020-01-13T23:59:59Z', RENEWAL_ERROR_REASON.NOT_DUE, 'LKJ234'],
      ['2020-10-13T23:59:59Z', RENEWAL_ERROR_REASON.NOT_DUE, 'MHG356']
    ])('titleAndBodyMessage is result of moment().format()', async (endDate, reason, referenceNumber) => {
      const formatSymbol = Symbol('formatResult').toString()
      moment.mockImplementation(
        getMomentMockImpl({
          format: () => formatSymbol
        })
      )

      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason, endDate },
        referenceNumber
      }))

      const { ...titleAndBodyMessage } = await getData({
        cache: () => ({
          helpers: {
            status: {
              getCurrentPermission: mockStatusCacheGet
            }
          }
        }),
        i18n: {
          getCatalog: jest.fn(() => englishTranslations)
        },
        locale: ''
      })

      const { bodyMessage } = getTitleAndBodyMessage(englishTranslations, reason, referenceNumber, formatSymbol)

      expect(titleAndBodyMessage.bodyMessage).toEqual(bodyMessage)
    })

    it('endDate is passed to moment', async () => {
      const endDate = Symbol('endDate')
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate },
        referenceNumber: 'ABC123'
      }))
      moment.mockImplementation(getMomentMockImpl())
      await getData(mockRequest)
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
      await getData(mockRequest)
      expect(moment).toHaveBeenCalledWith(expect.any(String), cacheSymbol, expect.any(String))
    })

    it('locale is set on moment, to whatever the request.locale is', async () => {
      const language = Symbol('language')
      const mockRequest = {
        cache: () => ({
          helpers: {
            status: {
              getCurrentPermission: mockStatusCacheGet
            }
          }
        }),
        i18n: {
          getCatalog: jest.fn(() => englishTranslations)
        },
        locale: language
      }
      mockStatusCacheGet.mockImplementationOnce(() => ({
        authentication: { reason: RENEWAL_ERROR_REASON.NOT_DUE, endDate: '2020-12-13T23:59:59Z' },
        referenceNumber: 'ABC123'
      }))
      const format = jest.fn()
      moment.mockImplementation(getMomentMockImpl({ format }))
      await getData(mockRequest)
      console.log('mock', mockRequest.locale)
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
      await getData(mockRequest)
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

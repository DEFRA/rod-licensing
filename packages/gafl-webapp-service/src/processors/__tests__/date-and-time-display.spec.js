import { displayStartTime, displayEndTime, displayExpiryDate, advancePurchaseDateMoment } from '../date-and-time-display.js'
import moment from 'moment-timezone'
import constant from '@defra-fish/business-rules-lib'

jest.mock('@defra-fish/business-rules-lib', () => ({
  START_AFTER_PAYMENT_MINUTES: 40,
  SERVICE_LOCAL_TIME: 'Europe/London'
}))

jest.mock('moment-timezone', () => ({
  tz: () => ({
    isSame: () => {},
    add: () => ({
      format: () => '2020-01-06T00:00:00.000',
      locale: () => ({ format: () => ({ replace: () => {} }) })
    }),
    locale: jest.fn(() => ({ format: () => '' })),
    format: () => {}
  }),
  format: () => {},
  locale: jest.fn(),
  utc: jest.fn(() => ({
    tz: () => ({
      locale: jest.fn(() => ({ format: () => '' })),
      format: () => {}
    })
  }))
}))

const getSampleRequest = (labelOverrides = {}) => ({
  i18n: {
    getCatalog: () => ({
      licence_start_time_am_text_0: '0.00am (first minute of the day)',
      licence_start_time_am_text_12: '12:00pm (midday)',
      renewal_start_date_expires_5: 'on',
      ...labelOverrides
    })
  },
  locale: 'en'
})

describe('displayStartTime', () => {
  it('permission licence start date is passed to moment when start date is found', () => {
    const startDate = '2021-01-01'
    const realMoment = jest.requireActual('moment-timezone')
    moment.utc.mockReturnValueOnce(realMoment(startDate))
    displayStartTime(getSampleRequest(), { startDate })
    expect(moment.utc).toHaveBeenCalledWith(startDate, null, expect.any(String))
  })

  it.each([
    [[50], ['2021-01-01T00:00:00.000Z'], [' minutes until fishing begins!']],
    [[10000], ['2010-12-23T14:00:00.000Z'], [' minutes until the salmon are yours']],
    [[0], ['2029-06-030T01:00:00.000Z'], [' minutes until cobwebs are brushed off your rod']]
  ])(
    'generates a string of payment delay (%s) followed by licence_summary_minutes_after_payment label when licence is to start after payment',
    async (startAfterMinutes, startDate, message) => {
      constant.START_AFTER_PAYMENT_MINUTES = startAfterMinutes
      const mockRequest = getSampleRequest({
        licence_summary_minutes_after_payment: message
      })
      const expectedReturnText = `${startAfterMinutes}${message}`
      const startAfterPaymentMinutes = displayStartTime(mockRequest, { startDate, licenceToStart: 'after-payment' })
      expect(startAfterPaymentMinutes).toEqual(expectedReturnText)
    }
  )

  it.each([
    ['2021-01-01', '0.00am (first minute of the day) on 1 January 2021'], // no time given
    ['2021-01-01T00:00:00.000Z', '0.00am (first minute of the day) on 1 January 2021'], // where start time is midnight
    ['2020-01-01T00:01:00.000Z', '12:01am on 1 January 2020'], // where start time is 1 minute past midnight
    ['2021-01-01T12:00:00.000Z', '12:00pm (midday) on 1 January 2021'], // where start time is 12pm
    ['2021-01-01T15:00:00.000Z', '3:00pm on 1 January 2021'], // where start time is 3pm (UTC)
    ['2021-07-01T14:00:00.000Z', '3:00pm on 1 July 2021'] // where start time is 3pm (BST)
  ])('displays the date in the correct format, when permission date is %s and current date and time is %s', (startDate, expectedResult) => {
    const realMoment = jest.requireActual('moment-timezone')
    moment.utc.mockReturnValue(realMoment(startDate))
    const startTime = displayStartTime(getSampleRequest(), { startDate })
    expect(startTime).toEqual(expectedResult)
  })

  it('should return locale-specific date string', () => {
    const expectedLocale = Symbol('expected locale')
    const locale = jest.fn(() => ({ format: () => 'locale-aware birth date' }))
    const startDate = '2021-01-01T00:00:00.000Z'
    const mockRequest = {
      i18n: {
        getCatalog: () => ({
          licence_start_time_am_text_0: '0.00am (first minute of the day)',
          licence_start_time_am_text_12: '12:00pm (midday)',
          renewal_start_date_expires_5: 'on'
        })
      },
      locale: expectedLocale
    }
    moment.utc.mockImplementation(() => ({
      tz: () => ({
        locale,
        format: () => {}
      })
    }))
    displayStartTime(mockRequest, { startDate })
    expect(locale).toHaveBeenCalledWith(expectedLocale)
  })
})

describe('displayEndTime', () => {
  it('permission licence end date is passed to moment', () => {
    moment.utc.mockReturnValue({
      tz: () => ({
        format: () => ''
      })
    })
    const endDate = Symbol('endDate')
    displayEndTime(getSampleRequest(), { endDate })
    expect(moment.utc).toHaveBeenCalledWith(endDate, null, expect.any(String))
  })

  it.each([
    ['2020-01-06T12:00:00.000Z', '12:00pm (midday) on 6 January 2020'],
    ['2020-08-06T11:00:00.000Z', '12:00pm (midday) on 6 August 2020'],
    ['2020-01-01T00:00:00.000Z', '11:59pm on 31 December 2019'],
    ['2020-01-01T00:01:00.000Z', '12:01am on 1 January 2020'],
    ['2020-01-01T15:00:00.000Z', '3:00pm on 1 January 2020']
  ])('displays the date in the correct format, when permission date is %s and current date and time is %s', (endDate, expectedResult) => {
    const realMoment = jest.requireActual('moment-timezone')
    moment.utc.mockReturnValueOnce(realMoment(endDate))
    const startTime = displayEndTime(getSampleRequest(), { endDate })
    return expect(startTime).toEqual(expectedResult)
  })
})

describe('displayExpiryDate', () => {
  it('displays the expiry in the correct format (GMT)', () => {
    const renewedEndDate = '2020-01-06T00:00:00.000Z'
    const realMoment = jest.requireActual('moment-timezone')
    moment.utc.mockReturnValueOnce(realMoment(renewedEndDate))
    const expiryDate = displayExpiryDate(getSampleRequest(), { renewedEndDate })
    expect(expiryDate).toEqual('11:59pm on 5 January 2020')
  })
})

describe('advancePurchaseDateMoment', () => {
  it('returns the licence date with a start time of 0 hours', () => {
    const licenceStartDate = '2020-01-06'
    const returnDate = advancePurchaseDateMoment(licenceStartDate)
    expect(returnDate.format('YYYY-MM-DDTHH:mm:ss.SSS')).toStrictEqual('2020-01-06T00:00:00.000')
  })
})

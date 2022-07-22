import { displayStartTime, displayEndTime, displayExpiryDate } from '../date-and-time-display.js'
import moment from 'moment-timezone'

jest.mock('moment-timezone')
const getMomentMockImpl = (overrides = {}) =>
  jest.fn(() => ({
    utc: () => {},
    tz: () => ({ isSame: () => {} }),
    format: () => {},
    ...overrides
  }))

const getSampleRequest = () => ({
  i18n: {
    getCatalog: () => ({
      licence_start_time_am_text_0: '0.00am (first minute of the day)',
      licence_start_time_am_text_12: '12:00pm (midday)',
      renewal_start_date_expires_5: 'on'
    })
  }
})

describe('displayStartTime', () => {
  it('displays the date in the correct format where no start time is set', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01' }, getSampleRequest())
    expect(startTime).toEqual('0.00am (first minute of the day) on 1 January 2021')
  })
  it('displays the date in the correct format where the start time is midnight', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: 0 }, getSampleRequest())
    expect(startTime).toEqual('0.00am (first minute of the day) on 1 January 2021')
  })
  it('displays the date in the correct format where the start time is 12pm', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '12' }, getSampleRequest())
    expect(startTime).toEqual('12:00pm (midday) on 1 January 2021')
  })
  it('displays the date in the correct format where the start time is 3pm (UTC)', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '15' }, getSampleRequest())
    expect(startTime).toEqual('3:00pm on 1 January 2021')
  })
  it('displays the date in the correct format where the start time is 3pm (BST)', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-07-01', licenceStartTime: '15' }, getSampleRequest())
    expect(startTime).toEqual('3:00pm on 1 July 2021')
  })

  it('displays the date in the correct format where the API start time is midnight', () => {
    // Tests that the API start time is used if the date/time has just rolled over (purchase completed at 11.59.59pm)
    const startTime = displayStartTime({ startDate: '2021-01-01T00:00:00.000Z', licenceStartDate: '2020-12-31' }, getSampleRequest())
    expect(startTime).toEqual('0.00am (first minute of the day) on 1 January 2021')
  })
  it('displays the date in the correct where the API start time is 1 minute past midnight', () => {
    const startTime = displayStartTime({ startDate: '2020-01-01T00:01:00.000Z', licenceStartDate: '2020-01-01' }, getSampleRequest())
    expect(startTime).toEqual('12:01am on 1 January 2020')
  })
  it('displays the date in the correct format where the API start time is 12pm', () => {
    const startTime = displayStartTime(
      { startDate: '2021-01-01T12:00:00.000Z', licenceStartDate: '2020-01-01', licenceStartTime: '12' },
      getSampleRequest()
    )
    expect(startTime).toEqual('12:00pm (midday) on 1 January 2021')
  })
  it('displays the date in the correct format where the API start time is 3pm (UTC)', () => {
    const startTime = displayStartTime(
      { startDate: '2021-01-01T15:00:00.000Z', licenceStartDate: '2021-01-01', licenceStartTime: '15' },
      getSampleRequest()
    )
    expect(startTime).toEqual('3:00pm on 1 January 2021')
  })
  it('displays the date in the correct format where the API start time is 3pm (BST)', () => {
    const startTime = displayStartTime(
      { startDate: '2021-07-01T14:00:00.000Z', licenceStartDate: '2021-07-01', licenceStartTime: '15' },
      getSampleRequest()
    )
    expect(startTime).toEqual('3:00pm on 1 July 2021')
  })

  it.only('locale is set on moment, to whatever the request.locale is', async () => {
    const language = Symbol('locale')
    const mockRequest = {
      locale: language,
      i18n: {
        getCatalog: () => ({
          licence_start_time_am_text_0: '0.00am (first minute of the day)',
          licence_start_time_am_text_12: '12:00pm (midday)',
          renewal_start_date_expires_5: 'on'
        })
      }
    }
    const utc = jest.fn()
    moment.mockImplementation(getMomentMockImpl({ utc }))
    // console.log(moment.utc)
    displayStartTime(
      { startDate: '2021-07-01T14:00:00.000Z', licenceStartDate: '2021-07-01', licenceStartTime: '15' },
      mockRequest
    )
    expect(moment).toHaveBeenCalledWith(expect.any(String), expect.any(String), language)
  })
})

describe('displayEndTime', () => {
  it('displays the date in the correct format for midday end date (GMT)', () => {
    const endTime = displayEndTime(getSampleRequest(), { endDate: '2020-01-06T12:00:00.000Z' })
    expect(endTime).toEqual('12:00pm (midday) on 6 January 2020')
  })

  it('displays the date in the correct format for midday end date (BST)', () => {
    const endTime = displayEndTime(getSampleRequest(), { endDate: '2020-08-06T11:00:00.000Z' })
    expect(endTime).toEqual('12:00pm (midday) on 6 August 2020')
  })

  it('displays the date in the correct format for midnight end date (GMT)', () => {
    const endTime = displayEndTime(getSampleRequest(), { endDate: '2020-01-01T00:00:00.000Z' })
    expect(endTime).toEqual('11:59pm on 31 December 2019')
  })

  it('displays the date in the correct format for 1 minute past midnight end date (GMT)', () => {
    const endTime = displayEndTime(getSampleRequest(), { endDate: '2020-01-01T00:01:00.000Z' })
    expect(endTime).toEqual('12:01am on 1 January 2020')
  })

  it('displays the date in the correct format for 3pm end date (GMT)', () => {
    const endTime = displayEndTime(getSampleRequest(), { endDate: '2020-01-01T15:00:00.000Z' })
    expect(endTime).toEqual('3:00pm on 1 January 2020')
  })
})

describe('displayExpiryDate', () => {
  it('displays the expiry in the correct format (GMT)', () => {
    const expiryDate = displayExpiryDate(getSampleRequest(), { renewedEndDate: '2020-01-06T00:00:00.000Z' })
    expect(expiryDate).toEqual('11:59pm on 5 January 2020')
  })
})

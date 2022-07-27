import { displayStartTime, displayEndTime, displayExpiryDate } from '../date-and-time-display.js'
import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '../../constants.js'

jest.mock('moment-timezone', () => ({
  tz: jest.fn(() => ({
    isSame: () => {},
    add: () => ({
      format: () => ''
    })
  })),
  format: () => {},
  utc: jest.fn(() => ({ tz: () => {} }))
}))

const getSampleRequest = () => ({
  i18n: {
    getCatalog: () => ({
      licence_start_time_am_text_0: '0.00am (first minute of the day)',
      licence_start_time_am_text_12: '12:00pm (midday)',
      renewal_start_date_expires_5: 'on'
    })
  },
  locale: 'en'
})

describe.only('displayStartTime', () => {
  const mssgs = getSampleRequest().i18n.getCatalog()
  beforeEach(() => {
    jest.clearAllMocks()
  })
  it.each([
    ['2021-01-01', '0.00am (first minute of the day) on 1 January 2021'],
    ['2021-01-01T00:00:00.000Z', '0.00am (first minute of the day) on 1 January 2021'],
    ['2021-01-01T12:00:00.000Z', '12:00pm (midday) on 1 January 2021'],
    ['2021-01-01T15:00:00.000Z', '3:00pm on 1 January 2021'],
    ['2021-07-01T15:00:00.000Z', '3:00pm on 1 July 2021']
  ])(
    'displays the date in the correct format, when permission date is %s and current date and time is %s',
    (startDate, expectedResult) => {
      const realMoment = jest.requireActual('moment-timezone')
      moment.utc.mockReturnValue(realMoment(startDate))
      const startTime = displayStartTime({ startDate }, mssgs)
      return expect(startTime).toEqual(expectedResult)
    }
  )

  // it('displays the date in the correct format where no start time is set', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ licenceStartDate: '2021-01-01' }, mssgs)
  //   expect(startTime).toEqual('')
  // })
  // it('displays the date in the correct format where the start time is midnight', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: 0 }, mssgs)
  //   expect(startTime).toEqual()
  // })
  // it('displays the date in the correct format where the start time is 12pm', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '12' }, mssgs)
  //   expect(startTime).toEqual()
  // })
  // it('displays the date in the correct format where the start time is 3pm (UTC)', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '15' }, mssgs)
  //   expect(startTime).toEqual()
  // })
  // it('displays the date in the correct format where the start time is 3pm (BST)', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ licenceStartDate: '2021-07-01', licenceStartTime: '15' }, mssgs)
  //   expect(startTime).toEqual()
  // })

  // it('displays the date in the correct format where the API start time is midnight', () => {
  //   // Tests that the API start time is used if the date/time has just rolled over (purchase completed at 11.59.59pm)
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ startDate: '2021-01-01T00:00:00.000Z', licenceStartDate: '2020-12-31' }, mssgs)
  //   expect(startTime).toEqual('0.00am (first minute of the day) on 1 January 2021')
  // })
  // it('displays the date in the correct where the API start time is 1 minute past midnight', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime({ startDate: '2020-01-01T00:01:00.000Z', licenceStartDate: '2020-01-01' }, mssgs)
  //   expect(startTime).toEqual('12:01am on 1 January 2020')
  // })
  // it('displays the date in the correct format where the API start time is 12pm', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime(
  //     { startDate: '2021-01-01T12:00:00.000Z', licenceStartDate: '2020-01-01', licenceStartTime: '12' },
  //     mssgs
  //   )
  //   expect(startTime).toEqual('12:00pm (midday) on 1 January 2021')
  // })
  // it('displays the date in the correct format where the API start time is 3pm (UTC)', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime(
  //     { startDate: '2021-01-01T15:00:00.000Z', licenceStartDate: '2021-01-01', licenceStartTime: '15' },
  //     mssgs
  //   )
  //   expect(startTime).toEqual('3:00pm on 1 January 2021')
  // })
  // it('displays the date in the correct format where the API start time is 3pm (BST)', () => {
  //   const mssgs = getSampleRequest().i18n.getCatalog()
  //   const startTime = displayStartTime(
  //     { startDate: '2021-07-01T14:00:00.000Z', licenceStartDate: '2021-07-01', licenceStartTime: '15' },
  //     mssgs
  //   )
  //   expect(startTime).toEqual('3:00pm on 1 July 2021')
  // })
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
  ])(
    'displays the date in the correct format, when permission date is %s and current date and time is %s',
    (endDate, expectedResult) => {
      const realMoment = jest.requireActual('moment-timezone')
      moment.utc.mockReturnValueOnce(realMoment(endDate))
      const startTime = displayEndTime(getSampleRequest(), { endDate })
      return expect(startTime).toEqual(expectedResult)
    }
  )
})

describe('displayExpiryDate', () => {
  it('displays the expiry in the correct format (GMT)', () => {
    const expiryDate = displayExpiryDate(getSampleRequest(), { renewedEndDate: '2020-01-06T00:00:00.000Z' })
    expect(expiryDate).toEqual('11:59pm on 5 January 2020')
  })
})

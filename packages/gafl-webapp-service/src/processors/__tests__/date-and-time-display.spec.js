import { displayStartTime, displayEndTime, displayExpiryDate } from '../date-and-time-display.js'

describe('displayStartTime', () => {
  it('displays the date in the correct format where no start time is set', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01' })
    expect(startTime).toEqual('Friday, January 1st, 2021, 12:00am (midnight)')
  })
  it('displays the date in the correct format where the start time is midnight', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: 0 })
    expect(startTime).toEqual('Friday, January 1st, 2021, 12:00am (midnight)')
  })
  it('displays the date in the correct format where the start time is 12pm', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '12' })
    expect(startTime).toEqual('Friday, January 1st, 2021, 12:00pm (midday)')
  })
  it('displays the date in the correct format where the start time is 3pm', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '15' })
    expect(startTime).toEqual('Friday, January 1st, 2021, 3:00pm')
  })
})

describe('displayEndTime', () => {
  it('displays the date in the correct format for midday end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-06T12:00:00.000Z' })
    expect(endTime).toEqual('Monday, January 6th, 2020, 12:00pm (midday)')
  })

  it('displays the date in the correct format for midday end date (BST)', () => {
    const endTime = displayEndTime({ endDate: '2020-08-06T11:00:00.000Z' })
    expect(endTime).toEqual('Thursday, August 6th, 2020, 12:00pm (midday)')
  })

  it('displays the date in the correct format for midnight end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-01T00:00:00.000Z' })
    expect(endTime).toEqual('Tuesday, December 31st, 2019, 11:59pm')
  })

  it('displays the date in the correct format for 3pm end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-01T15:00:00.000Z' })
    expect(endTime).toEqual('Wednesday, January 1st, 2020, 3:00pm')
  })
})

describe('displayExpiryDate', () => {
  it('displays the expiry in the correct format (GMT)', () => {
    const expiryDate = displayExpiryDate({ renewedEndDate: '2020-01-06T00:00:00.000Z' })
    expect(expiryDate).toEqual('Sunday, January 5th, 2020, 11:59pm')
  })
})

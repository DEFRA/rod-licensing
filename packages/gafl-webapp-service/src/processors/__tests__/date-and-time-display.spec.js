import { displayStartTime, displayEndTime, displayExpiryDate } from '../date-and-time-display.js'

describe('displayStartTime', () => {
  it('displays the date in the correct format where no start time is set', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01' })
    expect(startTime).toEqual('Start of the day, Friday, January 1st, 2021')
  })
  it('displays the date in the correct format where the start time is midnight', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: 0 })
    expect(startTime).toEqual('Start of the day, Friday, January 1st, 2021')
  })
  it('displays the date in the correct format where the start time is 12pm', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '12' })
    expect(startTime).toEqual('Midday, Friday, January 1st, 2021')
  })
  it('displays the date in the correct format where the start time is 3pm', () => {
    const startTime = displayStartTime({ licenceStartDate: '2021-01-01', licenceStartTime: '15' })
    expect(startTime).toEqual('3:00pm, Friday, January 1st, 2021')
  })
})

describe('displayEndTime', () => {
  it('displays the date in the correct format for midday end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-06T12:00:00.000Z' })
    expect(endTime).toEqual('Midday Monday, January 6th, 2020')
  })

  it('displays the date in the correct format for midday end date (BST)', () => {
    const endTime = displayEndTime({ endDate: '2020-08-06T11:00:00.000Z' })
    expect(endTime).toEqual('Midday Thursday, August 6th, 2020')
  })

  it('displays the date in the correct format for midnight end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-01T00:00:00.000Z' })
    expect(endTime).toEqual('11:59pm Tuesday, December 31st, 2019')
  })

  it('displays the date in the correct format for 3pm end date (GMT)', () => {
    const endTime = displayEndTime({ endDate: '2020-01-01T15:00:00.000Z' })
    expect(endTime).toEqual('3:00pm Wednesday, January 1st, 2020')
  })
})

describe('displayExpiryDate', () => {
  it('displays the expiry in the correct format (GMT)', () => {
    const expiryDate = displayExpiryDate({ renewedEndDate: '2020-01-06T00:00:00.000Z' })
    expect(expiryDate).toEqual('11:59pm, Sunday, January 5th, 2020')
  })
})

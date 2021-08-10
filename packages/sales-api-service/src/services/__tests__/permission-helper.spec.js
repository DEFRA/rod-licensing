import { logStartDateError } from '../permission-helper.js'
import moment from 'moment'

const consoleError = console.error

describe('logStartDateError', () => {
  beforeAll(() => {
    console.error = jest.fn()
  })
  beforeEach(jest.clearAllMocks)
  afterAll(() => {
    console.error = consoleError
  })

  it('logs if start date is before issue date', () => {
    const samplePermission = {
      startDate: '2021-08-10T04:05:54Z',
      issueDate: '2021-08-10T14:05:54Z'
    }
    logStartDateError(samplePermission)
    expect(console.error).toHaveBeenCalled()
  })

  it('logs if start date is before current time, if no issue date is provided', () => {
    const samplePermission = {
      startDate: moment().subtract(5, 'hours').toISOString()
    }
    logStartDateError(samplePermission)
    expect(console.error).toHaveBeenCalled()
  })

  it('doesn\'t log if start date is after issue date', () => {
    const samplePermission = {
      startDate: '2021-08-10T14:35:54Z',
      issueDate: '2021-08-10T14:05:54Z'
    }
    logStartDateError(samplePermission)
    expect(console.error).not.toHaveBeenCalled()
  })

  it('doesn\'t log if start date is after current date', () => {
    const samplePermission = {
      startDate: moment().add(30, 'minutes').toISOString()
    }
    logStartDateError(samplePermission)
    expect(console.error).not.toHaveBeenCalled()
  })
})

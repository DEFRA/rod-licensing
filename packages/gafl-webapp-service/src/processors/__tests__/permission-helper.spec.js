import moment from 'moment'
import { logStartDateError } from '../permission-helper.js'

const consoleError = console.error

describe('logStartDateError', () => {
  beforeAll(() => {
    console.error = jest.fn()
  })

  beforeEach(jest.clearAllMocks)

  afterAll(() => {
    console.error = consoleError
  })

  it('logs if start date is before issue date', async () => {
    const samplePermission = {
      startDate: '2021-08-10T04:05:54Z',
      issueDate: '2021-08-10T14:05:54Z'
    }
    await logStartDateError(samplePermission, getFakeRequest())
    expect(console.error).toHaveBeenCalledWith('permission start date before issue date: ', samplePermission)
  })

  it('logs if start date is before current time, if no issue date is provided', async () => {
    const samplePermission = {
      startDate: moment()
        .subtract(5, 'hours')
        .toISOString()
    }
    await logStartDateError(samplePermission, getFakeRequest())
    expect(console.error).toHaveBeenCalledWith('permission start date before current time: ', samplePermission)
  })

  it("doesn't log if start date is after issue date", async () => {
    const samplePermission = {
      startDate: '2021-08-10T14:35:54Z',
      issueDate: '2021-08-10T14:05:54Z'
    }
    await logStartDateError(samplePermission, getFakeRequest())
    expect(console.error).not.toHaveBeenCalled()
  })

  it("doesn't log if start date is after current date", async () => {
    const samplePermission = {
      startDate: moment()
        .add(30, 'minutes')
        .toISOString()
    }
    await logStartDateError(samplePermission, getFakeRequest())
    expect(console.error).not.toHaveBeenCalled()
  })

  it("doesn't log if it's a POCL import", async () => {
    const samplePermission = {
      startDate: moment()
        .subtract(5, 'hours')
        .toISOString(),
      dataSource: { id: 910400000 }
    }
    await logStartDateError(samplePermission, getFakeRequest())
    expect(console.error).not.toHaveBeenCalled()
  })

  const getFakeRequest = () => ({
    cache: jest.fn(() => ({
      helpers: {
        transaction: {
          get: jest.fn(() => ({}))
        },
        page: {
          get: jest.fn(() => ({}))
        },
        status: {
          get: jest.fn(() => ({}))
        }
      }
    }))
  })
})

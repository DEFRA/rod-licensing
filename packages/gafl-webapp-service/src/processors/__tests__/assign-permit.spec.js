import { assignPermit } from '../assign-permit.js'
import filterPermits from '../filter-permits.js'
import db from 'debug'

jest.mock('../filter-permits.js')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const debugMock = db.mock.results[0].value

const getMockRequest = ({ setCurrentPermission = () => {} }) => ({
  cache: jest.fn(() => ({
    helpers: {
      transaction: {
        setCurrentPermission
      }
    }
  }))
})

const getMockPermission = (overrides = {}) => ({
  hash: 'l00kaha5h',
  permit: jest.fn(),
  ...overrides
})

describe('assignPermit', () => {
  beforeEach(jest.resetAllMocks)

  it('returns the permit if it was found', async () => {
    const permitPermissions = { newCostStartDate: '2023-04-01', newCost: 1 }
    filterPermits.mockReturnValueOnce(permitPermissions)
    const result = await assignPermit(getMockPermission(), getMockRequest({}))
    expect(result).toEqual(
      expect.objectContaining({
        permit: {
          newCost: 1,
          newCostStartDate: '2023-04-01'
        }
      })
    )
  })

  it('setCurrentPermission is called with permission', async () => {
    const permitPermissions = { newCostStartDate: '2023-04-01', newCost: 1 }
    filterPermits.mockReturnValueOnce(permitPermissions)
    const result = await assignPermit(getMockPermission(), getMockRequest({}))
    expect(result).toEqual(
      expect.objectContaining({
        permit: {
          newCost: 1,
          newCostStartDate: '2023-04-01'
        }
      })
    )
  })

  it.each([
    ['newCostStartDate', { newCost: 1 }],
    ['newCost', { newCostStartDate: '2023-04-01' }],
    ['newCost and newCostStartDate', {}]
  ])(
    'returns a debug message advising the permit is missing new cost details if permit does not have %s',
    async (_d, permitPermissions) => {
      filterPermits.mockReturnValueOnce(permitPermissions)
      await assignPermit(getMockPermission(), getMockRequest({}))
      expect(debugMock).toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
    }
  )

  it('returns a debug message stating permit was not recieved if no permit was found', async () => {
    filterPermits.mockReturnValueOnce(false)
    await assignPermit(getMockPermission(), getMockRequest({}))
    expect(debugMock).toHaveBeenCalledWith("permit wasn't retrieved", expect.any(Object))
  })

  it('calls filterPermits with parameter of permission', async () => {
    const permission = getMockPermission()
    await assignPermit(permission, getMockRequest({}))
    expect(filterPermits).toHaveBeenCalledWith(permission)
  })
})

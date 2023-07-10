import { assignPermit, hashPermission } from '../find-and-hash-permit.js'
import filterPermits from '../filter-permits.js'
import crypto from 'crypto'
import db from 'debug'

jest.mock('../filter-permits.js')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const debugMock = db.mock.results[0].value

const getMockHashImplementation = (overrides = {}) =>
  jest.fn(() => ({
    update: jest.fn(() => {}),
    digest: jest.fn(() => {}),
    ...overrides
  }))

jest.mock('crypto', () => ({
  createHash: getMockHashImplementation()
}))

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

describe('find-and-hash-permit', () => {
  describe('hashPermission', () => {
    beforeEach(jest.resetAllMocks)

    it('calls createHash with sha256 as the argument', async () => {
      const hash = crypto.createHash('abc123')
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => hash }))
      const permission = getMockPermission({ hash })
      await assignPermit(permission, getMockRequest({}))

      expect(crypto.createHash).toHaveBeenCalledWith('sha256')
    })

    it('setCurrentPermission is called with a newly generated hash to the cloned permission if it does not have one already', async () => {
      const setCurrentPermission = jest.fn()
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      const permission = getMockPermission({ hash: undefined })
      await assignPermit(permission, getMockRequest({ setCurrentPermission }))

      expect(setCurrentPermission).toBeCalledWith(expect.objectContaining({ hash: 'hex' }))
    })

    it('returns a newly generated hash to the cloned permission if it does not have one already', async () => {
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      const permission = getMockPermission({ hash: undefined })
      const result = await hashPermission(permission, getMockRequest({}))
      expect(result).toEqual(expect.objectContaining({ hash: 'hex' }))
    })

    it('setCurrentPermission is called with the generated hash if the current hash is not the same as generated hash', async () => {
      const permission = getMockPermission()
      const setCurrentPermission = jest.fn()
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      await assignPermit(permission, getMockRequest({ setCurrentPermission }))

      expect(setCurrentPermission).toBeCalledWith(expect.objectContaining({ hash: 'hex' }))
    })

    it("returns the cloned permission's hash to the generated hash if the current hash is not the same as generated hash", async () => {
      const permission = getMockPermission()
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      const result = await hashPermission(permission, getMockRequest({}))
      expect(result).toEqual(expect.objectContaining({ hash: 'hex' }))
    })

    it('setCurrentPermission is called with the updated hash', async () => {
      const filteredPermit = Symbol('permit')
      const setCurrentPermission = jest.fn()
      const newHash = Symbol('new hash')
      filterPermits.mockReturnValueOnce(filteredPermit)
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
      const permission = getMockPermission({ hash: Symbol('old hash') })
      const result = getMockPermission({ hash: newHash })
      await assignPermit(permission, getMockRequest({ setCurrentPermission }))

      expect(setCurrentPermission).toBeCalledWith(expect.objectContaining({ hash: result.hash }))
    })

    it('returns the updated hash', async () => {
      const filteredPermit = Symbol('permit')
      const newHash = Symbol('new hash')
      filterPermits.mockReturnValueOnce(filteredPermit)
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
      const permission = getMockPermission({ hash: Symbol('old hash') })
      const result = await hashPermission(permission, getMockRequest({}))
      expect(result).toEqual(expect.objectContaining({ hash: newHash }))
    })

    it('logs permit data present and up to date', async () => {
      const mockPermission = getMockPermission({ hash: 'hex' })
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: newHash => newHash, update: () => 'hex' }))
      await assignPermit(mockPermission, getMockRequest({}))
      expect(debugMock).toHaveBeenCalledWith("permit data present and doesn't need updating")
    })
  })

  describe('assignPermit', () => {
    beforeEach(jest.resetAllMocks)

    it('returns the permit if it was found', async () => {
      const permitPermissions = { newCostStartDate: '2023-04-01', newCost: 1 }
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => '123' }))
      filterPermits.mockReturnValueOnce(permitPermissions)
      const result = await assignPermit(getMockPermission(), getMockRequest({}))
      console.log(result)
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
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => '123' }))
      filterPermits.mockReturnValueOnce(permitPermissions)
      const result = await assignPermit(getMockPermission(), getMockRequest({}))
      console.log(result)
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
        crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => '123' }))
        filterPermits.mockReturnValueOnce(permitPermissions)
        await assignPermit(getMockPermission(), getMockRequest({}))
        expect(debugMock).toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
      }
    )

    it('returns a debug message stating permit was not recieved if no permit was found', async () => {
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => '123' }))
      filterPermits.mockReturnValueOnce(false)
      await assignPermit(getMockPermission(), getMockRequest({}))
      expect(debugMock).toHaveBeenCalledWith("permit wasn't retrieved", expect.any(Object))
    })

    it('calls filterPermits with parameter of permission', async () => {
      const permission = getMockPermission()
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => '123' }))
      await assignPermit(permission, getMockRequest({}))
      expect(filterPermits).toHaveBeenCalledWith(permission)
    })
  })
})

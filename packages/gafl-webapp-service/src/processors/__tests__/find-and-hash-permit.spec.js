import { findPermit, hashPermission } from '../find-and-hash-permit.js'
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
  createHash: jest.fn(getMockHashImplementation())
}))

describe('find-and-hash-permit', () => {
  describe('hashPermission', () => {
    beforeEach(jest.resetAllMocks)

    it('calls createHash with sha256 as the argument', async () => {
      const hash = crypto.createHash('abc123')
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => hash }))
      const permission = getMockPermission({ hash })
      await hashPermission(permission)

      expect(crypto.createHash).toHaveBeenCalledWith('sha256')
    })

    it('assigns a newly generated has to the cloned permission if it does not have one already', async () => {
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      const permission = getMockPermission({ hash: undefined })
      const result = await hashPermission(permission)

      expect(result).toEqual('hex')
    })

    it("updates the cloned permission's hash to the generated hash if the current hash is not the same as generated hash", async () => {
      const permission = getMockPermission()
      crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
      const result = await hashPermission(permission)

      expect(result).toEqual('hex')
    })

    it('returns the updated hash', async () => {
      const filteredPermit = Symbol('permit')
      filterPermits.mockReturnValueOnce(filteredPermit)
      const newHash = Symbol('new hash')
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
      const permission = getMockPermission({ hash: Symbol('old hash') })
      const updatedHash = await hashPermission(permission)

      expect(updatedHash).toEqual(newHash)
    })

    it('logs permit data present and up to date', async () => {
      const mockPermission = getMockPermission({ hash: 'hex' })
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: newHash => newHash, update: () => 'hex' }))
      await hashPermission(mockPermission)
      expect(debugMock).toHaveBeenCalledWith("permit data present and doesn't need updating")
    })
  })

  describe('findPermit', () => {
    beforeEach(jest.resetAllMocks)

    it('returns the permit if it was found', async () => {
      const permitPermissions = { newCostStartDate: '2023-04-01', newCost: 1 }
      filterPermits.mockReturnValueOnce(permitPermissions)
      const returnedPermit = await findPermit(getMockPermission())
      expect(returnedPermit).toEqual(expect.objectContaining(
        {
          newCost: 1,
          newCostStartDate: '2023-04-01'
        }
      ))
    })

    it.each([
      ['newCostStartDate', { newCost: 1 }],
      ['newCost', { newCostStartDate: '2023-04-01' }],
      ['newCost and newCostStartDate', {}]
    ])(
      'returns a debug message advising the permit is missing new cost details if permit does not have %s',
      async (_d, permitPermissions) => {
        filterPermits.mockReturnValueOnce(permitPermissions)
        await findPermit(getMockPermission())
        expect(debugMock).toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
      }
    )

    it('returns a debug message stating permit was not recieved if no permit was found', async () => {
      filterPermits.mockReturnValueOnce(false)
      await findPermit(getMockPermission())
      expect(debugMock).toHaveBeenCalledWith("permit wasn't retrieved", expect.any(Object))
    })
  })
  const getMockPermission = (overrides = {}) => ({
    hash: 'l00kaha5h',
    permit: jest.fn(),
    ...overrides
  })
})

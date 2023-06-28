import { findPermit, retrievePermit } from '../find-permit.js'
import filterPermits from '../filter-permits.js'
import crypto from 'crypto'
import db from 'debug'

jest.mock('../filter-permits.js')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const debugMock = db.mock.results[0].value

const getMockHashImplementation = (overrides = {}) =>
  jest.fn(() => ({
    update: () => {},
    digest: () => 'abc123',
    ...overrides
  }))

jest.mock('crypto', () => ({
  createHash: getMockHashImplementation()
}))

describe('findPermit', () => {
  beforeEach(jest.clearAllMocks)

  describe('findPermit function', () => {
    it('updates the clone permit permissions to have a new hash if it does not already have one', async () => {
      const permission = getMockPermission({ hash: null })
      const newHash = 'new hash'
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
      const clonedPermission = await findPermit(permission)
      expect(clonedPermission.hash).toEqual('new hash')
    })

    it('updates the clone permit permissions to have a an updated hash if the current hash differs from the current permit hash', async () => {
      const permission = getMockPermission({ hash: 'hashy123' })
      const newHash = 'new hash'
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
      const clonedPermission = await findPermit(permission)
      expect(clonedPermission.hash).toEqual('new hash')
    })

    it('returns a debug message advising update of permit data not needed if the permit hash matches the current hash', async () => {
      const permission = getMockPermission()
      const matchedHash = 'l00kaha5h'
      crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => matchedHash }))
      await findPermit(permission)
      expect(debugMock).toBeCalledWith("permit data present and doesn't need updating")
    })
  })

  describe('retrievePermit', () => {
    it.each([
      ['newCostStartDate', { newCost: 1 }],
      ['newCost', { newCostStartDate: '2023-04-01' }],
      ['newCost and newCostStartDate', {}]
    ])(
      'returns a debug message advising the permit is missing new cost details if permit does not have %s',
      async (_d, permitPermissions) => {
        filterPermits.mockReturnValueOnce(permitPermissions)
        await retrievePermit(getMockPermission())
        expect(debugMock).toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
      }
    )

    it('returns a debug message stating permit was not recieved if no permit was found', async () => {
      filterPermits.mockReturnValueOnce(false)
      await retrievePermit(getMockPermission())
      expect(debugMock).toHaveBeenCalledWith("permit wasn't retrieved", expect.any(Object))
    })
  })
})

const getMockPermission = (overrides = {}) => ({
  hash: 'l00kaha5h',
  permit: jest.fn(),
  ...overrides
})

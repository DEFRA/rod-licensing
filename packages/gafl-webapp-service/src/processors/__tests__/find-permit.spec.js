import { findPermit } from '../find-permit.js'
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

  describe('debug', () => {
    it('logs permit missing', async () => {
      await findPermit(getMockPermission(), getMockRequest())
      expect(debugMock).toHaveBeenCalledWith("permit wasn't retrieved", expect.any(Object))
    })

    it.each([
      ['newCostStartDate', { newCost: 1 }],
      ['newCost', { newCostStartDate: '2023-04-01' }],
      ['newCost and newCostStartDate', {}]
    ])('logs permit missing %s', async (_d, p) => {
      filterPermits.mockReturnValueOnce(p)
      await findPermit(getMockPermission(), getMockRequest())
      expect(debugMock).toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
    })

    it("doesn't log if newCost and newCostStartDate are defined", async () => {
      filterPermits.mockReturnValueOnce({ newCost: 1, newCostStartDate: '2023-04-01' })
      await findPermit(getMockPermission(), getMockRequest())
      expect(debugMock).not.toHaveBeenCalledWith('permit missing new cost details', expect.any(Object))
    })

    it('logs permit data present and up to date', async () => {
      const mockPermission = getMockPermission()
      mockPermission.hash = 'abc123'
      await findPermit(mockPermission, getMockRequest())
      expect(debugMock).toHaveBeenCalledWith("permit data present and doesn't need updating")
    })
  })

  describe('when the permission has no hash', () => {
    it('generates a new hash', async () => {
      await findPermit(getMockPermission(), getMockRequest())

      expect(crypto.createHash).toHaveBeenCalledWith('sha256')
    })

    it('updates the permission with the right permit', async () => {
      const filteredPermit = Symbol('permit')
      filterPermits.mockReturnValueOnce(filteredPermit)

      const permission = getMockPermission()
      const request = getMockRequest()
      await findPermit(permission, request)

      expect(request.cache.mock.results[0].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
        expect.objectContaining({ permit: filteredPermit })
      )
    })
  })

  describe('when the permission already has a hash', () => {
    it('generates a new hash', async () => {
      const oldHash = crypto.createHash()

      const permission = getMockPermission({ hash: oldHash })
      await findPermit(permission, getMockRequest())

      expect(crypto.createHash).toHaveBeenCalledWith('sha256')
    })

    describe('when the new hash does not match the existing hash', () => {
      it('updates the permission with the permit and new hash', async () => {
        const filteredPermit = Symbol('permit')
        filterPermits.mockReturnValueOnce(filteredPermit)
        const newHash = Symbol('new hash')
        crypto.createHash.mockImplementation(getMockHashImplementation({ digest: () => newHash }))

        const permission = getMockPermission({ hash: Symbol('old hash') })
        const request = getMockRequest()
        await findPermit(permission, request)

        const expectedData = { permit: filteredPermit, hash: newHash }
        expect(request.cache.mock.results[0].value.helpers.transaction.setCurrentPermission).toHaveBeenCalledWith(
          expect.objectContaining(expectedData)
        )
      })
    })

    describe('when the new hash matches the existing hash', () => {
      it('does not update the permission', async () => {
        const sameHash = Symbol('same hash')
        crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => sameHash }))

        const permission = getMockPermission({ hash: sameHash })
        const request = getMockRequest()
        await findPermit(permission, request)

        expect(request.cache).not.toHaveBeenCalled()
      })
    })
  })

  const getMockPermission = (overrides = {}) => ({
    hash: null,
    permit: jest.fn(),
    ...overrides
  })

  const getMockRequest = () => ({
    cache: jest.fn(() => ({
      helpers: {
        transaction: {
          setCurrentPermission: jest.fn()
        }
      }
    }))
  })
})

import { hashPermission } from '../hash-permission.js'
import crypto from 'crypto'
import db from 'debug'

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

describe('hashPermission', () => {
  beforeEach(jest.resetAllMocks)

  it('calls createHash with sha256 as the argument', async () => {
    const hash = crypto.createHash('abc123')
    crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => hash }))
    const permission = getMockPermission({ hash })
    await hashPermission(permission, getMockRequest({}))

    expect(crypto.createHash).toHaveBeenCalledWith('sha256')
  })

  it('setCurrentPermission is called with a newly generated hash to the cloned permission if it does not have one already', async () => {
    const setCurrentPermission = jest.fn()
    crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
    const permission = getMockPermission({ hash: undefined })
    await hashPermission(permission, getMockRequest({ setCurrentPermission }))

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
    await hashPermission(permission, getMockRequest({ setCurrentPermission }))

    expect(setCurrentPermission).toBeCalledWith(expect.objectContaining({ hash: 'hex' }))
  })

  it("returns the cloned permission's hash to the generated hash if the current hash is not the same as generated hash", async () => {
    const permission = getMockPermission()
    crypto.createHash.mockImplementationOnce(() => ({ digest: newHash => newHash, update: () => permission.hash }))
    const result = await hashPermission(permission, getMockRequest({}))
    expect(result).toEqual(expect.objectContaining({ hash: 'hex' }))
  })

  it('setCurrentPermission is called with the updated hash', async () => {
    const setCurrentPermission = jest.fn()
    const newHash = Symbol('new hash')
    crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
    const permission = getMockPermission({ hash: Symbol('old hash') })
    const result = getMockPermission({ hash: newHash })
    await hashPermission(permission, getMockRequest({ setCurrentPermission }))

    expect(setCurrentPermission).toBeCalledWith(expect.objectContaining({ hash: result.hash }))
  })

  it('returns the updated hash', async () => {
    const newHash = Symbol('new hash')
    crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: () => newHash }))
    const permission = getMockPermission({ hash: Symbol('old hash') })
    const result = await hashPermission(permission, getMockRequest({}))
    expect(result).toEqual(expect.objectContaining({ hash: newHash }))
  })

  it('logs permit data present and up to date', async () => {
    const mockPermission = getMockPermission({ hash: 'hex' })
    crypto.createHash.mockImplementationOnce(getMockHashImplementation({ digest: newHash => newHash, update: () => 'hex' }))
    await hashPermission(mockPermission, getMockRequest({}))
    expect(debugMock).toHaveBeenCalledWith("permit data present and doesn't need updating")
  })
})

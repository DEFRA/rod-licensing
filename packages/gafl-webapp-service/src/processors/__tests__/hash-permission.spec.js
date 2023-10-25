import crypto from 'crypto'
import hashPermission from '../hash-permission.js'

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({ digest: () => 'aaa111', update: () => {} }))
}))

describe('hash permission', () => {
  beforeEach(jest.clearAllMocks)
  it.each(['abc-123', 'def-910'])('creates hash (%s) for permission', hash => {
    crypto.createHash.mockReturnValueOnce({ digest: () => hash, update: () => {} })
    const hashedPermission = hashPermission({})
    expect(hashedPermission).toBe(hash)
  })

  it('uses sha256 algorithm for hashing', () => {
    hashPermission({})
    expect(crypto.createHash).toHaveBeenCalledWith('sha256')
  })

  it('uses hex encoding for hashing', () => {
    const digest = jest.fn()
    crypto.createHash.mockReturnValueOnce({ digest, update: () => {} })
    hashPermission({})
    expect(digest).toHaveBeenCalledWith('hex')
  })

  it.each([
    { isLicenceForYou: true, licenceToStart: 'after-payment', licenceStartDate: '2023-09-18' },
    { licenceType: 'Trout and coarse', numberOfRods: '2', licenceLength: '12M' },
    { licenceStartTime: null, numberOfRods: '3', licenceLength: '8D' }
  ])('passes string representation of permission (%o) to hash ', samplePermission => {
    const update = jest.fn()
    crypto.createHash.mockReturnValueOnce({ digest: () => '', update })
    const jsonPermission = JSON.stringify(samplePermission)
    hashPermission(samplePermission)
    expect(update).toHaveBeenCalledWith(jsonPermission)
  })

  it.each`
    keyToOmit     | samplePermission
    ${'hash'}     | ${{ property1: '1', property2: 'Two', property3: 'Trois', hash: 'sdfghj345678' }}
    ${'permit'}   | ${{ property1: '1', property2: 'Two', property3: 'Trois', permit: { id: 'permit-1' } }}
    ${'licensee'} | ${{ property1: '1', property2: 'Two', property3: 'Trois', licensee: { name: 'Brenin Pysgotwr' } }}
  `("doesn't pass $keyToOmit to hash", ({ keyToOmit, samplePermission }) => {
    const permissionCopy = { ...samplePermission }
    delete permissionCopy[keyToOmit]
    const update = jest.fn()
    crypto.createHash.mockReturnValueOnce({ digest: () => '', update })
    const jsonPermission = JSON.stringify(permissionCopy)
    hashPermission(samplePermission)
    expect(update).toHaveBeenCalledWith(jsonPermission)
  })
})

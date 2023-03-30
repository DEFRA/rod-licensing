import { displayPermissionPrice } from '../price-display.js'
import { getPermissionCost } from '@defra-fish/business-rules-lib'

jest.mock('@defra-fish/business-rules-lib', () => ({
  getPermissionCost: jest.fn(() => 1)
}))

const getSampleLabels = ({ free = 'Free', pound = '£' } = {}) => ({
  free,
  pound
})

describe('displayPermissionPrice', () => {
  it('passes permission to getPermissionCost', () => {
    const permission = Symbol('permission')
    displayPermissionPrice(permission, getSampleLabels())
    expect(getPermissionCost).toHaveBeenCalledWith(permission)
  })

  it.each([
    [27.46, '£27.46', getSampleLabels()],
    [37.5, '£37.50', getSampleLabels()],
    [46, '£46', getSampleLabels()],
    [48, '#48', getSampleLabels({ pound: '#' })],
    [0, 'Free', getSampleLabels()],
    [0, 'Gratis', getSampleLabels({ free: 'Gratis' })]
  ])('converts cost returned from getPermissionCost (%d) to string value (%s)', (cost, expectedDisplayPrice, labels) => {
    getPermissionCost.mockReturnValueOnce(cost)
    expect(displayPermissionPrice({}, labels)).toBe(expectedDisplayPrice)
  })
})

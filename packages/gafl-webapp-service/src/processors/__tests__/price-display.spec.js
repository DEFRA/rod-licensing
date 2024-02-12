import { displayPermissionPrice, displayPrice } from '../price-display.js'
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
    displayPermissionPrice(permission, getSampleLabels(), undefined)
    expect(getPermissionCost).toHaveBeenCalledWith(permission, undefined)
  })

  it('passes createdDate to getPermissionCost', () => {
    const permission = Symbol('permission')
    const createdDate = Symbol('createdDate')
    displayPermissionPrice(permission, getSampleLabels(), createdDate)
    expect(getPermissionCost).toHaveBeenCalledWith(permission, createdDate)
  })

  it.each([
    [27.46, '£27.46', getSampleLabels()],
    [37.5, '£37.50', getSampleLabels()],
    [46, '£46', getSampleLabels()],
    [48, '#48', getSampleLabels({ pound: '#' })],
    [0, 'Free', getSampleLabels()],
    [0, 'Gratis', getSampleLabels({ free: 'Gratis' })]
  ])('converts cost returned from getPermissionCost (%d) to string value (%s)', (price, expectedDisplayPrice, labels) => {
    getPermissionCost.mockReturnValueOnce(price)
    expect(displayPermissionPrice({}, labels)).toBe(expectedDisplayPrice)
  })

  it.each([
    [27.46, '£27.46', getSampleLabels()],
    [37.5, '£37.50', getSampleLabels()],
    [46, '£46', getSampleLabels()],
    [48, '#48', getSampleLabels({ pound: '#' })],
    [0, 'Free', getSampleLabels()],
    [0, 'Gratis', getSampleLabels({ free: 'Gratis' })]
  ])('displays price %d as %s', (price, expectedDisplayPrice, labels) => {
    expect(displayPrice(price, labels)).toBe(expectedDisplayPrice)
  })
})

import { hasJunior, hasSenior } from '../concession-helper.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay, isPhysical } from '../licence-type-display.js'

const permission = {}

const mssgs = {
  over_65: 'Over 65',
  age_junior: 'Junior',
  licence_type_radio_salmon: 'Salmon and sea trout',
  licence_type_radio_trout_two_rod: 'Trout and coarse, up to 2 rods',
  licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods'
}

jest.mock('../concession-helper', () => ({
  hasJunior: jest.fn(),
  hasSenior: jest.fn()
}))

jest.mock('../mapping-constants', () => ({
  LICENCE_TYPE: {
    'trout-and-coarse': 'Trout and coarse',
    'salmon-and-sea-trout': 'Salmon and sea trout'
  }
}))

describe('licenceTypeDisplay', () => {
  it('returns junior if person is junior', () => {
    hasJunior.mockImplementationOnce(() => true)
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual('Junior, Salmon and sea trout')
  })

  it('returns senior if person is senior', () => {
    hasSenior.mockImplementationOnce(() => true)
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual('Over 65, Salmon and sea trout')
  })

  it.each([
    ['Salmon and sea trout', null, 'Salmon and sea trout'],
    ['Trout and coarse', '2', 'Trout and coarse, up to 2 rods'],
    ['Trout and coarse', '3', 'Trout and coarse, up to 3 rods']
  ])('returns correct licence type', (licenceType, numberOfRods, expected) => {
    permission.licenceType = licenceType
    permission.numberOfRods = numberOfRods
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual(expected)
  })
})

describe('licenceTypeAndLengthDisplay', () => {
  it.each([
    ['12M', 'Salmon and sea trout', null, 'Salmon and sea trout, 12 months'],
    ['12M', 'Trout and coarse', '2', 'Trout and coarse, up to 2 rods, 12 months'],
    ['12M', 'Trout and coarse', '3', 'Trout and coarse, up to 3 rods, 12 months'],
    ['8D', 'Salmon and sea trout', null, 'Salmon and sea trout, 8 days'],
    ['8D', 'Trout and coarse', '2', 'Trout and coarse, up to 2 rods, 8 days'],
    ['8D', 'Trout and coarse', '3', 'Trout and coarse, up to 3 rods, 8 days'],
    ['1D', 'Salmon and sea trout', null, 'Salmon and sea trout, 1 day'],
    ['1D', 'Trout and coarse', '2', 'Trout and coarse, up to 2 rods, 1 day'],
    ['1D', 'Trout and coarse', '3', 'Trout and coarse, up to 3 rods, 1 day']
  ])('returns correct licence length', (licenceLength, licenceType, numberOfRods, expected) => {
    permission.licenceLength = licenceLength
    permission.licenceType = licenceType
    permission.numberOfRods = numberOfRods
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual(expected)
  })

  it('returns junior if licence length is junior', () => {
    hasJunior.mockImplementationOnce(() => true)
    permission.licenceLength = '12M'
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual('Junior, Salmon and sea trout, 12 months')
  })

  it('returns senior if licence length is senior', () => {
    hasSenior.mockImplementationOnce(() => true)
    permission.licenceLength = '12M'
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual('Over 65, Salmon and sea trout, 12 months')
  })
})

describe('isPhysical', () => {
  it('returns true if licence length is 12 months and is not a junior', () => {
    hasJunior.mockImplementationOnce(() => false)
    permission.licenceLength = '12M'
    const result = isPhysical(permission)
    expect(result).toEqual(true)
  })

  it('returns false if licence length is not 12 months and a junior', () => {
    hasJunior.mockImplementationOnce(() => true)
    permission.licenceLength = '8D'
    const result = isPhysical(permission)
    expect(result).toEqual(false)
  })
})

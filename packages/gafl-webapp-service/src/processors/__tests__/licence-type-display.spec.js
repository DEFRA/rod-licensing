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

  it('returns Salmon and sea trout if type is Salmon and sea trout', () => {
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual('Salmon and sea trout')
  })

  it('returns Trout and coarse, up to 2 rods if type is Trout and coarse, up to 2 rods', () => {
    permission.licenceType = 'Trout and coarse'
    permission.numberOfRods = '2'
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual('Trout and coarse, up to 2 rods')
  })

  it('returns Trout and coarse, up to 3 rods if type is Trout and coarse, up to 3 rods', () => {
    permission.licenceType = 'Trout and coarse'
    permission.numberOfRods = '3'
    const result = licenceTypeDisplay(permission, mssgs)
    expect(result).toEqual('Trout and coarse, up to 3 rods')
  })
})

describe('licenceTypeAndLengthDisplay', () => {
  it('returns 12 months if licence length is 12M', () => {
    permission.licenceLength = '12M'
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual('Salmon and sea trout, 12 months')
  })

  it('returns 8 days if licence length is 8D', () => {
    permission.licenceLength = '8D'
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual('Salmon and sea trout, 8 days')
  })

  it('returns 1 day if licence length is 1D', () => {
    permission.licenceLength = '1D'
    permission.licenceType = 'Salmon and sea trout'
    const result = licenceTypeAndLengthDisplay(permission, mssgs)
    expect(result).toEqual('Salmon and sea trout, 1 day')
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

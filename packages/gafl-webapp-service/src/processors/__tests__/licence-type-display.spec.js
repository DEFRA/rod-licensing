import { hasJunior, hasSenior } from '../concession-helper.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay, isPhysical, recurringLicenceTypeDisplay } from '../licence-type-display.js'

const getCatalog = () => ({
  over_66: ' (over_66)',
  age_junior: 'Junior, ',
  licence_type_radio_salmon: 'Salmon and sea trout',
  licence_type_radio_trout_two_rod: 'Trout and coarse, up to 2 rods',
  licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods',
  recurring_payment_set_up_bulletpoint_1_trout_2_rod: ' trout and coarse (2 rod)',
  recurring_payment_set_up_bulletpoint_1_trout_3_rod: ' trout and coarse (3 rod)',
  recurring_payment_set_up_bulletpoint_1_salmon: ' salmon and sea trout',
  licence_type_12m: '12 months',
  licence_type_8d: '8 days',
  licence_type_1d: '1 day'
})

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

const getPermission = overrides => ({
  licenceLength: '12M',
  licenceType: 'Salmon and sea trout',
  numberOfRods: null,
  ...overrides
})

describe('licenceTypeDisplay', () => {
  it('returns junior if person is junior', () => {
    const permission = getPermission()
    hasJunior.mockImplementationOnce(() => true)
    const result = licenceTypeDisplay(permission, getCatalog())
    expect(result).toEqual('Junior, Salmon and sea trout')
  })

  it('returns senior if person is senior', () => {
    const permission = getPermission()
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeDisplay(permission, getCatalog())
    expect(result).toEqual('Salmon and sea trout (over_66)')
  })

  it.each([
    ['Salmon and sea trout', null, 'Salmon and sea trout'],
    ['Trout and coarse', '2', 'Trout and coarse, up to 2 rods'],
    ['Trout and coarse', '3', 'Trout and coarse, up to 3 rods']
  ])('returns correct licence type', (licenceType, numberOfRods, expected) => {
    const permission = getPermission({ licenceType, numberOfRods })
    const result = licenceTypeDisplay(permission, getCatalog())
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
    const permission = getPermission({ licenceLength, licenceType, numberOfRods })
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual(expected)
  })

  it('returns junior if licence length is junior', () => {
    const permission = getPermission()
    hasJunior.mockImplementationOnce(() => true)
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('Junior, Salmon and sea trout, 12 months')
  })

  it('returns senior if licence length is senior', () => {
    const permission = getPermission()
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('Salmon and sea trout (over_66), 12 months')
  })

  it('returns correct licence length', () => {
    const permission = getPermission({ licenceLength: Symbol('12M') })
    let result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('Salmon and sea trout, 12 months')

    permission.licenceLength = Symbol('8D')
    result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('Salmon and sea trout, 8 days')

    permission.licenceLength = Symbol('1D')
    result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('Salmon and sea trout, 1 day')
  })
})

describe('isPhysical', () => {
  it('returns true if isForFulfilment is true', () => {
    const permit = { isForFulfilment: true }
    const permission = getPermission({ permit })
    const result = isPhysical(permission)
    expect(result).toEqual(true)
  })

  it('returns true if isForFulfilment is false', () => {
    const permit = { isForFulfilment: false }
    const permission = getPermission({ permit })
    const result = isPhysical(permission)
    expect(result).toEqual(false)
  })

  it('returns undefined if there is no permit set', () => {
    const permission = getPermission()
    const result = isPhysical(permission)
    expect(result).toEqual(undefined)
  })
})

describe('recurringLicenceTypeDisplay', () => {
  it.each([
    ['Salmon and sea trout', null, ' salmon and sea trout'],
    ['Trout and coarse', '2', ' trout and coarse (2 rod)'],
    ['Trout and coarse', '3', ' trout and coarse (3 rod)']
  ])(
    'when licence type is %s and number of rods is: %s. recurringLicenceTypeDisplay will return "%s"',
    (licenceType, numberOfRods, expected) => {
      const permission = getPermission({ licenceType, numberOfRods })
      const result = recurringLicenceTypeDisplay(permission, getCatalog())
      expect(result).toEqual(expected)
    }
  )
})

import { hasJunior, hasSenior } from '../concession-helper.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay, isPhysical, recurringLicenceTypeDisplay, licenceSummaryRows } from '../licence-type-display.js'

const getCatalog = (overrides = {}) => ({
  over_66: ' (over_66)',
  age_junior: 'junior ',
  licence_type_radio_salmon_payment_summary: 'salmon and sea trout',
  licence_type_radio_trout_two_rod_payment_summary: 'trout and coarse (up to 2 rods)',
  licence_type_radio_trout_three_rod_payment_summary: 'trout and coarse (up to 3 rods)',
  recurring_payment_set_up_bulletpoint_1_trout_2_rod: ' trout and coarse (2 rod)',
  recurring_payment_set_up_bulletpoint_1_trout_3_rod: ' trout and coarse (3 rod)',
  recurring_payment_set_up_bulletpoint_1_salmon: ' salmon and sea trout',
  licence_1_day: '1-day',
  licence_8_day: '8-day',
  licence_12_month: '12-month',
  licence_summary_name: 'licence_summary_name',
  identification: 'identification',
  licence_summary_type: 'licence_summary_type',
  licence_summary_length: 'licence_summary_length',
  starts: 'starts',
  ends: 'ends',
  licence_summary_disability_concession: 'licence_summary_disability_concession',
  age_concession: 'age_concession',
  ...overrides
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
    expect(result).toEqual('junior salmon and sea trout')
  })

  it('returns senior if person is senior', () => {
    const permission = getPermission()
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeDisplay(permission, getCatalog())
    expect(result).toEqual('salmon and sea trout (over_66)')
  })

  it.each([
    ['Salmon and sea trout', null, 'salmon and sea trout'],
    ['Trout and coarse', '2', 'trout and coarse (up to 2 rods)'],
    ['Trout and coarse', '3', 'trout and coarse (up to 3 rods)']
  ])('returns correct licence type', (licenceType, numberOfRods, expected) => {
    const permission = getPermission({ licenceType, numberOfRods })
    const result = licenceTypeDisplay(permission, getCatalog())
    expect(result).toEqual(expected)
  })
})

describe('licenceTypeAndLengthDisplay', () => {
  it.each([
    ['12M', 'Salmon and sea trout', null, '12-month salmon and sea trout'],
    ['12M', 'Trout and coarse', '2', '12-month trout and coarse (up to 2 rods)'],
    ['12M', 'Trout and coarse', '3', '12-month trout and coarse (up to 3 rods)'],
    ['8D', 'Salmon and sea trout', null, '8-day salmon and sea trout'],
    ['8D', 'Trout and coarse', '2', '8-day trout and coarse (up to 2 rods)'],
    ['8D', 'Trout and coarse', '3', '8-day trout and coarse (up to 3 rods)'],
    ['1D', 'Salmon and sea trout', null, '1-day salmon and sea trout'],
    ['1D', 'Trout and coarse', '2', '1-day trout and coarse (up to 2 rods)'],
    ['1D', 'Trout and coarse', '3', '1-day trout and coarse (up to 3 rods)']
  ])('returns correct licence length', (licenceLength, licenceType, numberOfRods, expected) => {
    const permission = getPermission({ licenceLength, licenceType, numberOfRods })
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual(expected)
  })

  it('returns junior if licence length is junior', () => {
    const permission = getPermission()
    hasJunior.mockImplementationOnce(() => true)
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('12-month junior salmon and sea trout')
  })

  it('returns senior if licence length is senior', () => {
    const permission = getPermission()
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('12-month salmon and sea trout (over_66)')
  })

  it('returns correct licence length, 12 months', () => {
    const permission = getPermission({ licenceLength: Symbol('12M') })
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('12-month salmon and sea trout')
  })

  it('returns correct licence length, 8 days', () => {
    const permission = getPermission({ licenceLength: Symbol('8D') })
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('8-day salmon and sea trout')
  })

  it('returns correct licence length, 1 day', () => {
    const permission = getPermission({ licenceLength: Symbol('1D') })
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('1-day salmon and sea trout')
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

describe.only('Licence Summary Rows', () => {
  const getSampleData = (overrides = {}) => ({
    permission: {
      licensee: {}
    },
    ...overrides
  })

  it.each([
    ['Brenin Pysgotwr', 'Brenin', 'Pysgotwr'],
    ['Julian Cope', 'Julian', 'Cope']
  ])('adds a row with first name and last name concatenated = "%s"', (expected, firstName, lastName) => {
    const extraLabel = { licence_summary_name: 'LiCeNcE SuMmArY NaMe' }
    const permission = getPermission()
    permission.licensee = {
      firstName,
      lastName
    }
    const catalog = getCatalog(extraLabel)
    const lsr = licenceSummaryRows(catalog, getSampleData({ permission }))
    expect(lsr[0]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.licence_summary_name
        },
        value: {
          text: expected
        }
      })
    )
  })

  it.each([
    '76y8789uy78u787uy7887u',
    'jhuiuyhjui8u8iujhyu7yhgtyue8u7'
  ])('adds a row with obfuscated DoB - "%s"', obfuscatedDob => {
    const extraLabel = { identification: 'IdEnTiFiCaTiOn' }
    const catalog = getCatalog(extraLabel)
    const permission = getPermission()
    permission.licensee = {
      obfuscatedDob
    }
    const lsr = licenceSummaryRows(catalog, getSampleData({ permission }))
    expect(lsr[1]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.identification
        },
        value: {
          text: obfuscatedDob
        }
      })
    )
  })

  it.each([
    'Shopping trollies and old wellies',
    'Cardboard and seaweed'
  ])('adds a row with licence type "%s"', licenceTypeStr => {
    const extraLabel = { licence_summary_type: 'LiCeNcE SuMmArY TyPe' }
    const catalog = getCatalog(extraLabel)
    const lsr = licenceSummaryRows(catalog, getSampleData({ licenceTypeStr }))
    expect(lsr[2]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.licence_summary_type
        },
        value: {
          text: licenceTypeStr
        }
      })
    )
  })

  it.each([
    'Twelve Months',
    '28 seconds',
    '15 minutes'
  ])('adds a row with licence length "%s"', lengthText => {
    const extraLabel = { licence_summary_length: 'LiCeNcE SuMmArY LeNgTh' }
    const catalog = getCatalog(extraLabel)
    const lsr = licenceSummaryRows(catalog, getSampleData({ lengthText }))
    expect(lsr[3]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.licence_summary_length
        },
        value: {
          text: lengthText
        }
      })
    )
  })

  it.each([
    'Now',
    'Half an hour',
    '2027-10-09T16:19:28.890Z'
  ])('adds a row with start time "%s"', startTimeString => {
    const extraLabel = { starts: 'StArts' }
    const catalog = getCatalog(extraLabel)
    const lsr = licenceSummaryRows(catalog, getSampleData({ startTimeString }))
    expect(lsr[4]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.starts
        },
        value: {
          text: startTimeString
        }
      })
    )
  })

  it.each([
    'One year',
    'Ten Years',
    '2028-10-09T17:33:12.967Z'
  ])('adds a row with end time "%s"', endTimeString => {
    const extraLabel = { ends: 'EnDs' }
    const catalog = getCatalog(extraLabel)
    const lsr = licenceSummaryRows(catalog, getSampleData({ endTimeString }))
    expect(lsr[5]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabel.ends
        },
        value: {
          text: endTimeString
        }
      })
    )
  })

  it('adds a row with disability concession shown', () => {
    const extraLabels = { licence_summary_disability_concession: 'LiCeNcE SuMmArY DiSaBiLiTy CoNcEsSiOn', yes: 'YeS' }
    const catalog = getCatalog(extraLabels)
    const lsr = licenceSummaryRows(catalog, getSampleData({ disabled: true }))
    expect(lsr[6]).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabels.licence_summary_disability_concession
        },
        value: {
          text: extraLabels.yes
        }
      })
    )
  })

  it('omits disability concession row if disabled flag is false', () => {
    const extraLabels = { licence_summary_disability_concession: 'LiCeNcE SuMmArY DiSaBiLiTy CoNcEsSiOn', yes: 'YeS' }
    const catalog = getCatalog(extraLabels)
    const lsr = licenceSummaryRows(catalog, getSampleData({ disabled: false }))
    expect(lsr[6]).not.toEqual(
      expect.objectContaining({
        key: {
          text: extraLabels.licence_summary_disability_concession
        },
        value: {
          text: extraLabels.yes
        }
      })
    )
  })

  it.each([
    ['Junior', true], 
    ['Junior', false], 
    ['Senior', true],
    ['Senior', false]
  ])('adds a last row with age concession - %s when disabled flag is %b', (ageConcessionText, disabled) => {
    const extraLabels = { age_concession: 'AgE CoNcEsSiOn' }
    const catalog = getCatalog(extraLabels)
    const lsr = licenceSummaryRows(catalog, getSampleData({ ageConcessionText, ageConcession: true, disabled }))
    expect(lsr.pop()).toEqual(
      expect.objectContaining({
        key: {
          text: extraLabels.age_concession
        },
        value: {
          text: ageConcessionText
        }
      })
    )
  })

  it.each([true, false])('omits final age concession row when ageConcession flag is false and  disabled flag is %b', disabled => {
    const catalog = getCatalog()
    const ageConcessionText = 'Senior'
    const lsr = licenceSummaryRows(getCatalog(), getSampleData({ ageConcessionText, ageConcession: false, disabled }))
    expect(lsr.pop()).not.toEqual(
      expect.objectContaining({
        key: {
          text: catalog.age_concession
        },
        value: {
          text: ageConcessionText
        }
      })
    )
  })

})

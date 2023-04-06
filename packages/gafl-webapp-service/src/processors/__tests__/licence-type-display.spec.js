import { hasJunior, hasSenior } from '../concession-helper.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay, isPhysical, getErrorPage } from '../licence-type-display.js'
import { SENIOR_AGE_CHANGE_DATE } from '@defra-fish/business-rules-lib'
import moment from 'moment-timezone'
import { NAME, DATE_OF_BIRTH, LICENCE_TO_START, LICENCE_TYPE, LICENCE_LENGTH } from '../../uri.js'

jest.mock('../../uri.js', () => ({
  NAME: { uri: Symbol('name') },
  DATE_OF_BIRTH: { uri: Symbol('date of birth') },
  LICENCE_TO_START: { uri: Symbol('licence to start') },
  LICENCE_TYPE: { uri: Symbol('licence type') },
  LICENCE_LENGTH: { uri: Symbol('licence length') }
}))

const getCatalog = () => ({
  over_65: 'over_65',
  over_66: 'over_66',
  age_junior: 'Junior',
  licence_type_radio_salmon: 'Salmon and sea trout',
  licence_type_radio_trout_two_rod: 'Trout and coarse, up to 2 rods',
  licence_type_radio_trout_three_rod: 'Trout and coarse, up to 3 rods'
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
    const permission = getPermission({ licenceStartDate: moment(SENIOR_AGE_CHANGE_DATE).add(-1, 'day').format('YYYY-MM-DD') })
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeDisplay(permission, getCatalog())
    expect(result).toEqual('over_65, Salmon and sea trout')
  })

  it.each([
    ['on', SENIOR_AGE_CHANGE_DATE],
    ['after', moment(SENIOR_AGE_CHANGE_DATE).add(1, 'day').format('YYYY-MM-DD')]
  ])('shows over 66 message for permissions starting %s SENIOR_AGE_CHANGE_DATE', (_d, licenceStartDate) => {
    const permission = getPermission({ licenceStartDate })
    const catalog = getCatalog()
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeDisplay(permission, catalog)
    expect(result).toEqual(`${catalog.over_66}, ${permission.licenceType}`)
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
    const permission = getPermission({ licenceStartDate: moment(SENIOR_AGE_CHANGE_DATE).add(-1, 'day').format('YYYY-MM-DD') })
    hasSenior.mockImplementationOnce(() => true)
    const result = licenceTypeAndLengthDisplay(permission, getCatalog())
    expect(result).toEqual('over_65, Salmon and sea trout, 12 months')
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

describe('getErrorPage', () => {
  it.each([
    ['NAME.uri when firstName', { firstName: false }, NAME.uri],
    ['NAME.uri when lastName', { lastName: false }, NAME.uri],
    ['DATE_OF_BIRTH.uri when birthDate', { birthDate: false }, DATE_OF_BIRTH.uri],
    ['LICENCE_TO_START.uri when licenceStartDate', { licenceStartDate: false }, LICENCE_TO_START.uri],
    ['LICENCE_TYPE.uri when numberOfRods', { numberOfRods: false }, LICENCE_TYPE.uri],
    ['LICENCE_TYPE.uri when licenceType', { licenceType: false }, LICENCE_TYPE.uri],
    ['LICENCE_LENGTH.uri when licenceLength', { licenceLength: false }, LICENCE_LENGTH.uri],
    ['empty string when nothing', {}, '']
  ])('returns %s is omitted', (_description, spec, expectedUri) => {
    const permission = getSamplePermission(spec)
    const errorPage = getErrorPage(permission)
    expect(errorPage).toEqual(expectedUri)
  })

  const getSamplePermission = spec => {
    const parsedSpec = {
      firstName: true,
      lastName: true,
      birthDate: true,
      licenceStartDate: true,
      numberOfRods: true,
      licenceType: true,
      licenceLength: true,
      ...spec
    }
    return {
      licensee: {
        firstName: parsedSpec.firstName ? 'firstName' : undefined,
        lastName: parsedSpec.lastName ? 'lastName' : undefined,
        birthDate: parsedSpec.birthDate ? '01/01/1970' : undefined
      },
      licenceStartDate: parsedSpec.licenceStartDate ? '01/01/2022' : undefined,
      numberOfRods: parsedSpec.numberOfRods ? 2 : undefined,
      licenceType: parsedSpec.licenceType ? 'Salmon & Sea Trout' : undefined,
      licenceLength: parsedSpec.licenceLength ? '12M' : undefined
    }
  }
})

describe('getErrorPage', () => {
  it.each([
    ['NAME.uri when firstName', { firstName: false }, NAME.uri],
    ['NAME.uri when lastName', { lastName: false }, NAME.uri],
    ['DATE_OF_BIRTH.uri when birthDate', { birthDate: false }, DATE_OF_BIRTH.uri],
    ['LICENCE_TO_START.uri when licenceStartDate', { licenceStartDate: false }, LICENCE_TO_START.uri],
    ['LICENCE_TYPE.uri when numberOfRods', { numberOfRods: false }, LICENCE_TYPE.uri],
    ['LICENCE_TYPE.uri when licenceType', { licenceType: false }, LICENCE_TYPE.uri],
    ['LICENCE_LENGTH.uri when licenceLength', { licenceLength: false }, LICENCE_LENGTH.uri],
    ['empty string when nothing', {}, '']
  ])('returns %s is omitted', (_description, spec, expectedUri) => {
    const permission = getSamplePermission(spec)
    const errorPage = getErrorPage(permission)
    expect(errorPage).toEqual(expectedUri)
  })

  const getSamplePermission = spec => {
    const parsedSpec = {
      firstName: true,
      lastName: true,
      birthDate: true,
      licenceStartDate: true,
      numberOfRods: true,
      licenceType: true,
      licenceLength: true,
      ...spec
    }
    return {
      licensee: {
        firstName: parsedSpec.firstName ? 'firstName' : undefined,
        lastName: parsedSpec.lastName ? 'lastName' : undefined,
        birthDate: parsedSpec.birthDate ? '01/01/1970' : undefined
      },
      licenceStartDate: parsedSpec.licenceStartDate ? '01/01/2022' : undefined,
      numberOfRods: parsedSpec.numberOfRods ? 2 : undefined,
      licenceType: parsedSpec.licenceType ? 'Salmon & Sea Trout' : undefined,
      licenceLength: parsedSpec.licenceLength ? '12M' : undefined
    }
  }
})

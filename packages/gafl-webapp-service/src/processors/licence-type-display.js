import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'
import { NAME, DATE_OF_BIRTH, LICENCE_TO_START, LICENCE_TYPE, LICENCE_LENGTH } from '../uri.js'

export const getErrorPage = permission => {
  if (!permission.licensee.firstName || !permission.licensee.lastName) {
    return NAME.uri
  }

  if (!permission.licensee.birthDate) {
    return DATE_OF_BIRTH.uri
  }

  if (!permission.licenceStartDate) {
    return LICENCE_TO_START.uri
  }

  if (!permission.numberOfRods || !permission.licenceType) {
    return LICENCE_TYPE.uri
  }

  if (!permission.licenceLength) {
    return LICENCE_LENGTH.uri
  }

  return ''
}

export const licenceTypeDisplay = (permission, mssgs) => {
  const typesStrArr = []

  // Build the display string for the licence type
  if (concessionHelper.hasJunior(permission)) {
    typesStrArr.push(mssgs.age_junior)
  }
  if (permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout']) {
    typesStrArr.push(mssgs.licence_type_radio_salmon)
  } else if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    if (permission.numberOfRods === '2') {
      typesStrArr.push(mssgs.licence_type_radio_trout_two_rod)
    } else {
      typesStrArr.push(mssgs.licence_type_radio_trout_three_rod)
    }
  }

  if (concessionHelper.hasSenior(permission)) {
    typesStrArr.push(mssgs.over_66)
  }

  return typesStrArr.join('')
}

export const licenceTypeAndLengthDisplay = (permission, mssgs) => {
  switch (permission.licenceLength) {
    case '12M':
      return `${licenceTypeDisplay(permission, mssgs)}, 12 months`
    case '8D':
      return `${licenceTypeDisplay(permission, mssgs)}, 8 days`
    default:
      return `${licenceTypeDisplay(permission, mssgs)}, 1 day`
  }
}

export const isPhysical = permission => permission?.permit?.isForFulfilment

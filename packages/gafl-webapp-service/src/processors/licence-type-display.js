import { SENIOR_AGE_CHANGE_DATE } from '@defra-fish/business-rules-lib'
import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'
import moment from 'moment-timezone'

export const licenceTypeDisplay = (permission, mssgs) => {
  const typesStrArr = []

  // Build the display string for the licence type
  if (concessionHelper.hasJunior(permission)) {
    typesStrArr.push(mssgs.age_junior)
  } else if (concessionHelper.hasSenior(permission)) {
    if (moment(permission.licenceStartDate).isSameOrAfter(SENIOR_AGE_CHANGE_DATE)) {
      typesStrArr.push(mssgs.over_66)
    } else {
      typesStrArr.push(mssgs.over_65)
    }
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

  return typesStrArr.join(', ')
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

export const isPhysicalOld = permission => permission.licenceLength === '12M' && !concessionHelper.hasJunior(permission)

export const isPhysical = permission => permission?.permit?.isForFulfilment

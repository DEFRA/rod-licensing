import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'

export const licenceTypeDisplay = (permission, mssgs) => {
  const typesStrArr = []

  // Build the display string for the licence type
  if (concessionHelper.hasJunior(permission)) {
    typesStrArr.push(mssgs.age_junior)
  }
  if (permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout']) {
    typesStrArr.push(mssgs.licence_type_radio_salmon_payment_summary)
  } else if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    if (permission.numberOfRods === '2') {
      typesStrArr.push(mssgs.licence_type_radio_trout_two_rod_payment_summary)
    } else {
      typesStrArr.push(mssgs.licence_type_radio_trout_three_rod_payment_summary)
    }
  }

  if (concessionHelper.hasSenior(permission)) {
    typesStrArr.push(mssgs.over_66)
  }

  return typesStrArr.join('')
}

export const licenceTypeAndLengthDisplay = (permission, mssgs) => {
  const licenceTypeMessage = getLicenceTypeMessage(permission.licenceLength, mssgs)
  return `${licenceTypeMessage} ${licenceTypeDisplay(permission, mssgs)}`
}

const getLicenceTypeMessage = (licenceLength, mssgs) => {
  const length = typeof licenceLength === 'symbol' ? licenceLength.description : licenceLength
  if (length === '12M') {
    return mssgs.licence_12_month
  } else if (length === '8D') {
    return mssgs.licence_8_day
  } else {
    return mssgs.licence_1_day
  }
}

export const isPhysical = permission => permission?.permit?.isForFulfilment

export const recurringLicenceTypeDisplay = (permission, mssgs) => {
  if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    if (permission.numberOfRods === '2') {
      return mssgs.recurring_payment_set_up_bulletpoint_1_trout_2_rod
    } else {
      return mssgs.recurring_payment_set_up_bulletpoint_1_trout_3_rod
    }
  }
  return mssgs.recurring_payment_set_up_bulletpoint_1_salmon
}

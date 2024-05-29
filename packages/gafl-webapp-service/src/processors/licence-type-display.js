import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'

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

// export const licenceTypeAndLengthDisplay = (permission, mssgs) => {
//   switch (permission.licenceLength) {
//     case '12M':
//       return `${licenceTypeDisplay(permission, mssgs)}, ${mssgs.licence_type_12m}`
//     case '8D':
//       return `${licenceTypeDisplay(permission, mssgs)}, ${mssgs.licence_type_8d}`
//     default:
//       return `${licenceTypeDisplay(permission, mssgs)}, ${mssgs.licence_type_1d}`
//   }
// }

export const licenceTypeAndLengthDisplay = (permission, mssgs) => {
    const licenceTypeMessage =
    permission.licenceLength === '12M'
      ? mssgs.licence_type_12m
      : permission.licenceLength === '8D'
        ? mssgs.licence_type_8d
        : mssgs.licence_type_1d
    return `${licenceTypeDisplay(permission, mssgs)}, ${licenceTypeMessage}`
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

import * as concessionHelper from './concession-helper.js'
import * as mappings from './mapping-constants.js'

export const licenceTypeDisplay = permission => {
  const typesStrArr = []

  // Build the display string for the licence type
  if (concessionHelper.hasJunior(permission)) {
    typesStrArr.push('Junior')
  } else if (concessionHelper.hasSenior(permission)) {
    typesStrArr.push('Senior')
  }

  if (concessionHelper.hasDisabled(permission)) {
    typesStrArr.push('Disabled')
  }

  typesStrArr.push(permission.licenceType)

  if (permission.licenceLength === '12M' && permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    typesStrArr.push(permission.numberOfRods === '2' ? '2 rod' : '3 rod')
  }

  return typesStrArr.join(', ')
}

export const isPhysical = permission => permission.licenceLength === '12M' && !concessionHelper.hasJunior(permission)

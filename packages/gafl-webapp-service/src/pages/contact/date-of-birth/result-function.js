import * as concessionHelper from '../../../processors/concession-helper.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (permission.licensee.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!concessionHelper.hasJunior(permission.licensee) && !concessionHelper.hasSenior(permission.licensee)) {
    if (permission.licenceLength === '12M') {
      result = status.fromSummary ? 'summary' : 'adult'
    } else {
      // Other adult licences do not ask for benefit details
      result = status.fromSummary ? 'summary' : 'adultNoBenefitCheck'
    }
  } else if (concessionHelper.hasSenior(permission.licensee)) {
    result = status.fromSummary ? 'summary' : 'senior'
  } else {
    result = 'junior'
  }

  return result
}

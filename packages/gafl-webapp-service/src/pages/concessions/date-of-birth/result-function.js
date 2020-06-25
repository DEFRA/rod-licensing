import * as concessionHelper from '../../../processors/concession-helper.js'
import { CommonResults } from '../../../constants.js'

export const dateOfBirthResults = {
  NO_LICENCE_REQUIRED: 'no-licence-required',
  JUNIOR: 'junior',
  SENIOR: 'senior',
  ADULT: 'adult',
  JUNIOR_NO_BENEFIT: 'junior-no-benefit',
  SENIOR_NO_BENEFIT: 'senior-no-benefit',
  ADULT_NO_BENEFIT: 'adult-no-benefit'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (permission.licensee.noLicenceRequired) {
    result = dateOfBirthResults.NO_LICENCE_REQUIRED
  } else if (status.fromSummary) {
    result = concessionHelper.hasJunior(permission) ? dateOfBirthResults.JUNIOR : CommonResults.SUMMARY
  } else if (permission.licenceLength === '12M') {
    if (concessionHelper.hasJunior(permission)) {
      result = dateOfBirthResults.JUNIOR
    } else if (concessionHelper.hasSenior(permission)) {
      result = dateOfBirthResults.SENIOR
    } else {
      result = dateOfBirthResults.ADULT
    }
  } else {
    if (concessionHelper.hasJunior(permission)) {
      result = dateOfBirthResults.JUNIOR_NO_BENEFIT
    } else if (concessionHelper.hasSenior(permission)) {
      result = dateOfBirthResults.SENIOR_NO_BENEFIT
    } else {
      result = dateOfBirthResults.ADULT_NO_BENEFIT
    }
  }

  return result
}

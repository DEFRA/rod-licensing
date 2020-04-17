import * as concessionHelper from '../../../processors/concession-helper.js'

// TODO Actually from the summary needs to route through the benefit checks
export default async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (licensee.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!concessionHelper.hasJunior(licensee) && !concessionHelper.hasSenior(licensee)) {
    result = status.fromSummary ? 'summary' : 'adult'
  } else if (concessionHelper.hasSenior(licensee)) {
    result = status.fromSummary ? 'summary' : 'senior'
  } else {
    result = 'junior'
  }

  return result
}

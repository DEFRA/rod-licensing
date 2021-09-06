import { CONTACT_SUMMARY_SEEN, CommonResults, showDigitalLicencePages } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (status.renewal && isPhysical(permission) && permission.licensee.postalFulfilment !== false) {
    return showDigitalLicencePages.YES
  }

  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

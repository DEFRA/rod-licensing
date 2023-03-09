import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'
import { isPhysicalOld } from '../../../../processors/licence-type-display.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (status.fromSummary === CONTACT_SUMMARY_SEEN) {
    return CommonResults.SUMMARY
  } else if (isPhysicalOld(permission)) {
    return ShowDigitalLicencePages.YES
  }
  return ShowDigitalLicencePages.NO
}

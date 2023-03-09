import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages } from '../../../constants.js'
import { isPhysicalOld } from '../../../processors/licence-type-display.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (permission.isRenewal) {
    if (isPhysicalOld(permission) && status.showDigitalLicencePages) {
      return ShowDigitalLicencePages.YES
    } else {
      return CommonResults.SUMMARY
    }
  }

  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

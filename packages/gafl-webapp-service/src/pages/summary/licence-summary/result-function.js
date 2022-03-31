import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages, Multibuy } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { CheckMultibuyForYou } from '../../../handlers/multibuy-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (status.renewal) {
    if (isPhysical(permission) && status.showDigitalLicencePages) {
      return ShowDigitalLicencePages.YES
    } else {
      return CommonResults.SUMMARY
    }
  }

  if (CheckMultibuyForYou === true) {
    return Multibuy.YES
  }

  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

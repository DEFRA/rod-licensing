import { CONTACT_SUMMARY_SEEN, CommonResults, ShowDigitalLicencePages, MultibuyForYou } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { CheckMultibuyForYou } from '../../../handlers/multibuy-for-you-handler.js'

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

  const isMultibuyForYou = await CheckMultibuyForYou(request)

  if (isMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

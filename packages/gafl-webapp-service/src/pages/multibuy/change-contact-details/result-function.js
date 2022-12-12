import { CHANGE_CONTACT_DETAILS_SEEN, CommonResults, ShowDigitalLicencePages, MultibuyForYou } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { isMultibuyForYou } from '../../../handlers/multibuy-for-you-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (status.renewal) {
    if (isPhysical(permission) && status.showDigitalLicencePages) {
      return ShowDigitalLicencePages.YES
    }
    return CommonResults.SUMMARY
  }

  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  return status.changeContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN ? CommonResults.AMEND : CommonResults.OK
}

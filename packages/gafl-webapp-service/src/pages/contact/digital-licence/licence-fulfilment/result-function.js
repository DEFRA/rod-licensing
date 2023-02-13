import { CONTACT_SUMMARY_SEEN, CommonResults, MultibuyForYou, CHANGE_CONTACT_DETAILS_SEEN } from '../../../../constants.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  if (status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN) {
    return CommonResults.AMEND
  }

  if (status.fromSummary === CONTACT_SUMMARY_SEEN) {
    return CommonResults.SUMMARY
  }

  return CommonResults.OK
}

import { CONTACT_SUMMARY_SEEN, CommonResults, MultibuyForYou, CHANGE_CONTACT_DETAILS_SEEN } from '../../../../constants.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  return status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN
    ? CommonResults.AMEND
    : status.fromSummary === CONTACT_SUMMARY_SEEN
      ? CommonResults.SUMMARY
      : CommonResults.OK
}

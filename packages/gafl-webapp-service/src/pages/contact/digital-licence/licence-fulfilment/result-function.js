import { CONTACT_SUMMARY_SEEN, CommonResults, MultibuyForYou } from '../../../../constants.js'
import { CheckMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  const isMultibuyForYou = await CheckMultibuyForYou(request)

  if (isMultibuyForYou === true) {
    return MultibuyForYou.YES
  }

  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

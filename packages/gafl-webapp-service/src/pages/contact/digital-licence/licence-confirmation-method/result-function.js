import { CONTACT_SUMMARY_SEEN, CommonResults, CHANGE_CONTACT_DETAILS_SEEN } from '../../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN) {
    return CommonResults.AMEND
  }

  if (status.fromSummary === CONTACT_SUMMARY_SEEN) {
    return CommonResults.SUMMARY
  }

  return CommonResults.OK
}

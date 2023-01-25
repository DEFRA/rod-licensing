import { CONTACT_SUMMARY_SEEN, CommonResults, CHANGE_CONTACT_DETAILS_SEEN } from '../../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  return status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN
    ? CommonResults.AMEND
    : status.fromSummary === CONTACT_SUMMARY_SEEN
      ? CommonResults.SUMMARY
      : CommonResults.OK
}

import { CONTACT_SUMMARY_SEEN, CommonResults, CHANGE_CONTACT_DETAILS_SEEN } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const transaction = await request.cache().helpers.transaction.getCurrentPermission()

  const showSummary = !transaction.isLicenceForYou || status.fromSummary === CONTACT_SUMMARY_SEEN || transaction.isRenewal

  if (status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN) {
    return CommonResults.AMEND
  }

  if (showSummary) {
    return CommonResults.SUMMARY
  }

  return CommonResults.OK
}

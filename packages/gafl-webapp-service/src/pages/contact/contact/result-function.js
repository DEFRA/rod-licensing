import { CONTACT_SUMMARY_SEEN, CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const transaction = await request.cache().helpers.transaction.getCurrentPermission()

  return transaction.isLicenceForYou === false || status.fromSummary === CONTACT_SUMMARY_SEEN || transaction.isRenewal
    ? CommonResults.SUMMARY
    : CommonResults.OK
}

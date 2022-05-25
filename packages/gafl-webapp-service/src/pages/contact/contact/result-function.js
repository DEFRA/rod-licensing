import { CONTACT_SUMMARY_SEEN, CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  return status.fromSummary === CONTACT_SUMMARY_SEEN || permission.isRenewal ? CommonResults.SUMMARY : CommonResults.OK
}

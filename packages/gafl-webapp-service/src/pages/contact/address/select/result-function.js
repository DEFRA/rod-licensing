import { CONTACT_SUMMARY_SEEN, CommonResults } from '../../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary === CONTACT_SUMMARY_SEEN ? CommonResults.SUMMARY : CommonResults.OK
}

import { CHANGE_CONTACT_DETAILS_SEEN, CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromContactDetailsSeen === CHANGE_CONTACT_DETAILS_SEEN.SEEN ? CommonResults.AMEND : CommonResults.OK
}

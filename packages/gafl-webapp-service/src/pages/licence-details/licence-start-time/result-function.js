import { CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}

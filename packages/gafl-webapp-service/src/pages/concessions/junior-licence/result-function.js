import { CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (permission.licenceLength !== '12M' || status.fromSummary) {
    return CommonResults.SUMMARY
  } else {
    return CommonResults.OK
  }
}

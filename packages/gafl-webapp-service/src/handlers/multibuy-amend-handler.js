import { CommonResults } from '../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  if (status.fromLicenceOptions) {
    return CommonResults.AMEND
  } else if (status.fromSummary) {
    return CommonResults.SUMMARY
  } else {
    return CommonResults.OK
  }
}

import { CommonResults, CHANGE_LICENCE_OPTIONS_SEEN } from '../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  if (status.fromLicenceOptions) {
    request.cache().helpers.status.set({ fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.SEEN })
    return CommonResults.AMEND
  } else if (status.fromSummary) {
    request.cache().helpers.status.set({ fromLicenceOptions: CHANGE_LICENCE_OPTIONS_SEEN.NOT_SEEN })
    return CommonResults.SUMMARY
  } else {
    return CommonResults.OK
  }
}

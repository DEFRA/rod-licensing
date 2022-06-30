import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY } from '../uri.js'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../constants.js'

export default async (request, defaultUrl) => {
  if (request.cache) {
    const status = await request?.cache()?.helpers?.status?.getCurrentPermission()
    const summarySeen = status.fromSummary
    const changeLicenceOptionsSeen = status.fromLicenceOptions
    if (changeLicenceOptionsSeen) {
      return CHANGE_LICENCE_OPTIONS.uri
    } else if (summarySeen === LICENCE_SUMMARY_SEEN) {
      return LICENCE_SUMMARY.uri
    } else if (summarySeen === CONTACT_SUMMARY_SEEN) {
      return CONTACT_SUMMARY.uri
    } else {
      return defaultUrl
    }
  } else {
    return defaultUrl
  }
}

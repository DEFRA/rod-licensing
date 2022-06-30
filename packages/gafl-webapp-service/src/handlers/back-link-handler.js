import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY } from '../uri.js'
import { LICENCE_SUMMARY_SEEN } from '../constants.js'

export default async (status, defaultUrl) => {
  const summarySeen = status.fromSummary
  const changeLicenceOptionsSeen = status.fromLicenceOptions
  if (summarySeen || changeLicenceOptionsSeen) {
    if (changeLicenceOptionsSeen) {
      return CHANGE_LICENCE_OPTIONS.uri
    } else if (summarySeen === LICENCE_SUMMARY_SEEN) {
      return LICENCE_SUMMARY.uri
    } else {
      return CONTACT_SUMMARY.uri
    }
  } else {
    return defaultUrl
  }
}

import { CHANGE_CONTACT_OPTIONS, CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY } from '../uri.js'
import { LICENCE_SUMMARY_SEEN } from '../constants.js'

export default async (status, permission, defaultUri) => {
  const summarySeen = status.fromSummary
  const changeLicenceOptionsSeen = status.fromLicenceOptions
  const changeContactOptionsSeen = status.fromContactOptions

  if (changeLicenceOptionsSeen) {
    return CHANGE_LICENCE_OPTIONS.uri
  }
  if (changeContactOptionsSeen) {
    return CHANGE_CONTACT_OPTIONS.uri
  }
  if (summarySeen === LICENCE_SUMMARY_SEEN || ) {
    return LICENCE_SUMMARY.uri
  }
  if (summarySeen) {
    return CONTACT_SUMMARY.uri
  }
  return defaultUri
}

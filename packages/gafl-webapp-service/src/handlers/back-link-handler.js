import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY, CONTACT_SUMMARY, CHANGE_CONTACT_DETAILS } from '../uri.js'
import { LICENCE_SUMMARY_SEEN, CHANGE_LICENCE_OPTIONS_SEEN } from '../constants.js'

export default async (status, defaultUri) => {
  const summarySeen = status.fromSummary
  const isRenewal = status.isRenewal
  const changeLicenceOptionsSeen = status.fromLicenceOptions
  const fromContactDetailsSeen = status.fromContactDetails
  if (changeLicenceOptionsSeen === CHANGE_LICENCE_OPTIONS_SEEN.SEEN) {
    return CHANGE_LICENCE_OPTIONS.uri
  }
  if (fromContactDetailsSeen) {
    return CHANGE_CONTACT_DETAILS.uri
  }
  if (summarySeen === LICENCE_SUMMARY_SEEN || isRenewal) {
    return LICENCE_SUMMARY.uri
  }
  if (summarySeen) {
    return CONTACT_SUMMARY.uri
  }
  return defaultUri
}

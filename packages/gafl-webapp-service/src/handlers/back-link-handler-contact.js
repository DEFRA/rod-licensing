import { CONTACT_SUMMARY, CHANGE_CONTACT_DETAILS, LICENCE_SUMMARY } from '../uri.js'
import { CONTACT_SUMMARY_SEEN } from '../constants.js'

export default async (status, defaultUri) => {
  const summarySeen = status.fromSummary
  const fromContactDetailsSeen = status.changeContactDetails
  const isRenewal = status.isRenewal
  if (fromContactDetailsSeen) {
    return CHANGE_CONTACT_DETAILS.uri
  }
  if (summarySeen === CONTACT_SUMMARY_SEEN) {
    return CONTACT_SUMMARY.uri
  }
  if (isRenewal) {
    return LICENCE_SUMMARY.uri
  }
  return defaultUri
}

import { CHANGE_LICENCE_OPTIONS, LICENCE_SUMMARY } from '../uri.js'

import currentPageAssigner from '../routes/journey-definition.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const contactSummarySeen = status.fromSummary
  const changeLicenceOptionsSeen = status.fromLicenceOptions
  const currentPage = currentPageAssigner.current

  if (changeLicenceOptionsSeen) {
    return CHANGE_LICENCE_OPTIONS.uri
  } else if (contactSummarySeen) {
    return LICENCE_SUMMARY.uri
  }
  return currentPage
}

import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'

import { CONTACT_SUMMARY, LICENCE_SUMMARY, NAME, ADDRESS_ENTRY, ADDRESS_SELECT, ADDRESS_LOOKUP, CONTACT, NEWSLETTER } from '../../../uri.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!status.renewal) {
    if (!status[NAME.page]) {
      throw new GetDataRedirect(NAME.uri)
    }

    if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
      throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
    }

    if (!status[CONTACT.page]) {
      throw new GetDataRedirect(CONTACT.uri)
    }

    if (!status[NEWSLETTER.page]) {
      throw new GetDataRedirect(NEWSLETTER.uri)
    }
  }

  status.fromSummary = CONTACT_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  const countryName = await countries.nameFromCode(permission.licensee.countryCode)

  return {
    permission,
    countryName,
    isPhysical: isPhysical(permission),
    contactMethod: permission.licensee.preferredMethodOfConfirmation,
    newsLetter: permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none,
    howContacted: HOW_CONTACTED,
    uri: {
      name: NAME.uri,
      address: ADDRESS_LOOKUP.uri, // Encourage the address lookup on an amendment
      contact: CONTACT.uri,
      newsletter: NEWSLETTER.uri,
      licenceSummary: LICENCE_SUMMARY.uri
    }
  }
}

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, nextPage, getData)

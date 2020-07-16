import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'

import findPermit from '../find-permit.js'

import {
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  CONTROLLER,
  NAME,
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  ADDRESS_LOOKUP,
  CONTACT,
  NEWSLETTER
} from '../../../uri.js'

import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!status.renewal) {
    /*
     * Before we try and filter the permit it is necessary to check that the user has navigated through
     * the journey in such a way as to have gather all the required data. They have have manipulated the
     * journey by typing into the address bar in which case they will be redirected back to the
     * appropriate point in the journey
     */
    if (!status[LICENCE_SUMMARY.page]) {
      throw new GetDataRedirect(LICENCE_SUMMARY.uri)
    }

    if (!status[NAME.page]) {
      throw new GetDataRedirect(NAME.uri)
    }

    if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
      throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
    }

    if (!status[CONTACT.page]) {
      throw new GetDataRedirect(CONTACT.uri)
    }
  }

  status.fromSummary = CONTACT_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  await findPermit(permission, request)

  const countryName = await countries.nameFromCode(permission.licensee.countryCode)

  return {
    permission,
    countryName,
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

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, CONTROLLER.uri, getData)

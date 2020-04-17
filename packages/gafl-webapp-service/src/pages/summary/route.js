import pageRoute from '../../routes/page-route.js'
import GetDataRedirect from '../../handlers/get-data-redirect.js'
import getPermit from '../../processors/get-permit.js'
import moment from 'moment'

import {
  SUMMARY,
  CONTROLLER,
  NAME,
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  ADDRESS_LOOKUP,
  CONTACT,
  NEWSLETTER,
  DATE_OF_BIRTH
} from '../../constants.js'

import { HOW_CONTACTED } from '../../processors/mapping-constants.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (!status[NAME.page]) {
    throw new GetDataRedirect(NAME.uri)
  }

  if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
    throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
  }

  if (!status[CONTACT.page]) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  if (!status[DATE_OF_BIRTH.page]) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  status.fromSummary = true
  await request.cache().helpers.status.setCurrentPermission(status)

  const permit = await getPermit(request)
  console.log(permit)

  return {
    permission,
    contactMethod: permission.licensee.preferredMethodOfConfirmation,
    newsLetter: !!permission.licensee.preferredMethodOfNewsletter,
    howContacted: HOW_CONTACTED,
    birthDateStr: moment(permission.licensee.birthDate, 'YYYY-MM-DD').format('DD MM YYYY'),
    uri: {
      name: NAME.uri,
      address: status[ADDRESS_ENTRY.page] ? ADDRESS_ENTRY.uri : ADDRESS_LOOKUP.uri,
      contact: CONTACT.uri,
      newsletter: NEWSLETTER.uri,
      dateOfBirth: DATE_OF_BIRTH.uri
    }
  }
}

export default pageRoute(SUMMARY.page, SUMMARY.uri, null, CONTROLLER.uri, getData)

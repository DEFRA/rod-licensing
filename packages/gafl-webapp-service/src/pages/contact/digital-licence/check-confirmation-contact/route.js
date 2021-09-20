import { CHECK_CONFIRMATION_CONTACT, CONTACT, LICENCE_CONFIRMATION_METHOD } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'

export const getData = async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  if (licensee.preferredMethodOfConfirmation === HOW_CONTACTED.none) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  return {
    licensee,
    uri: {
      licenceConfirmationMethod: LICENCE_CONFIRMATION_METHOD.uri,
      contact: CONTACT.uri
    }
  }
}

export default pageRoute(CHECK_CONFIRMATION_CONTACT.page, CHECK_CONFIRMATION_CONTACT.uri, null, nextPage, getData)

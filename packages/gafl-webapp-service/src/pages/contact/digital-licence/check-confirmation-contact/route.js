import { CHECK_CONFIRMATION_CONTACT, CONTACT, LICENCE_CONFIRMATION_METHOD } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

export const getData = async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  if (licensee.preferredMethodOfConfirmation === HOW_CONTACTED.none) {
    throw new GetDataRedirect(CONTACT.uri)
  }

  const whatToChange = licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email ? '?change=email' : '?change=mobile'
  const change = addLanguageCodeToUri(request, `${LICENCE_CONFIRMATION_METHOD.uri}${whatToChange}`)

  return {
    licensee,
    uri: {
      contact: addLanguageCodeToUri(request, CONTACT.uri),
      change
    }
  }
}

export default pageRoute(CHECK_CONFIRMATION_CONTACT.page, CHECK_CONFIRMATION_CONTACT.uri, null, nextPage, getData)

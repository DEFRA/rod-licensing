import { LICENCE_NOT_FOUND, NEW_TRANSACTION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

export const getData = async request => {
  const mssgs = request.i18n.getCatalog()
  return {
    title: mssgs.licence_not_found_title,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(LICENCE_NOT_FOUND.page, LICENCE_NOT_FOUND.uri, null, nextPage, getData)

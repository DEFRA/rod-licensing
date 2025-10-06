import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_AUTHENTICATE, CANCEL_RP_IDENTIFY } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

export default pageRoute(
  CANCEL_RP_IDENTIFY.page,
  CANCEL_RP_IDENTIFY.uri,
  () => {},
  request => {
    return addLanguageCodeToUri(request, CANCEL_RP_AUTHENTICATE.uri)
  },
  () => {}
)

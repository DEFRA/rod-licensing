import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_DETAILS, CANCEL_RP_CONFIRM } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

export default pageRoute(
  CANCEL_RP_DETAILS.page,
  CANCEL_RP_DETAILS.uri,
  () => {},
  request => addLanguageCodeToUri(request, CANCEL_RP_CONFIRM.uri),
  () => {}
)

import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

export default pageRoute(
  CANCEL_RP_CONFIRM.page,
  CANCEL_RP_CONFIRM.uri,
  () => {},
  request => addLanguageCodeToUri(request, CANCEL_RP_COMPLETE.uri),
  () => {}
)

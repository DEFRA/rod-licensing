import { FALLBACK_LICENCE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

export default pageRoute(FALLBACK_LICENCE.page, FALLBACK_LICENCE.uri, null, nextPage)

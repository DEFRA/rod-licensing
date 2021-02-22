import pageRoute from '../../../../routes/page-route.js'
import { LICENCE_FULFILMENT } from '../../../../uri.js'
import { nextPage } from '../../../../routes/next-page.js'

export default pageRoute(LICENCE_FULFILMENT.page, LICENCE_FULFILMENT.uri, undefined, nextPage, undefined)

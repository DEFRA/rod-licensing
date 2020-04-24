import pageRoute from '../../routes/page-route.js'

import { ORDER_COMPLETE, CONTROLLER } from '../../constants.js'

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, CONTROLLER.uri)

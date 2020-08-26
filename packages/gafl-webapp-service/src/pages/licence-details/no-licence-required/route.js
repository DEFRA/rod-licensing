import { NO_LICENCE_REQUIRED, CONTROLLER } from '../../../uri.js'
import { SERVICE_PAGE_DEFAULT } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'

export default pageRoute(NO_LICENCE_REQUIRED.page, NO_LICENCE_REQUIRED.uri, null, CONTROLLER.uri, () => ({
  uri: {
    servicePage: process.env.SERVICE_PAGE || SERVICE_PAGE_DEFAULT
  }
}))

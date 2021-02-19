import pageRoute from '../../../../routes/page-route.js'
import { LICENCE_FULFILMENT } from '../../../../uri.js'
import { nextPage } from '../../../../routes/next-page.js'

const validator = () => {}
const getData = () => {}
export default pageRoute(LICENCE_FULFILMENT.page, LICENCE_FULFILMENT.uri, validator, nextPage, getData)

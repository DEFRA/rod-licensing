import { CANCEL_RP_ALREADY_CANCELLED, CANCEL_RP_IDENTIFY } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'

const getData = async request => {
  const {
    payload: { referenceNumber }
  } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  return {
    referenceNumber
  }
}

export default pageRoute(
  CANCEL_RP_ALREADY_CANCELLED.page,
  CANCEL_RP_ALREADY_CANCELLED.uri,
  () => {},
  () => {},
  getData
)

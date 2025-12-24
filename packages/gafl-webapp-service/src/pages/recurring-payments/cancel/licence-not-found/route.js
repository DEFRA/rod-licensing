import { CANCEL_RP_LICENCE_NOT_FOUND, CANCEL_RP_IDENTIFY } from '../../../../uri.js'
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
  CANCEL_RP_LICENCE_NOT_FOUND.page,
  CANCEL_RP_LICENCE_NOT_FOUND.uri,
  () => {},
  () => {},
  getData
)

import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_COMPLETE } from '../../../../uri.js'
import { cacheDateFormat, dateDisplayFormat } from '../../../../processors/date-and-time-display.js'
import moment from 'moment-timezone'

const getData = async request => {
  const { permission } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    licenceExpiry: moment(permission.endDate, cacheDateFormat, request.locale).format(dateDisplayFormat)
  }
}

export default pageRoute(
  CANCEL_RP_COMPLETE.page,
  CANCEL_RP_COMPLETE.uri,
  () => {},
  () => {},
  getData
)

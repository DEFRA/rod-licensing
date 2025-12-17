import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_COMPLETE, CANCEL_RP_CONFIRM, CANCEL_RP_IDENTIFY } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { cacheDateFormat } from '../../../../processors/date-and-time-display.js'
import moment from 'moment-timezone'

const getData = async request => {
  const { permission } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    licenceExpiry: moment(permission.endDate, cacheDateFormat, request.locale).format('Do MMMM, YYYY'),
    uri: {
      cancelRpIdentify: addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri)
    }
  }
}

export default pageRoute(
  CANCEL_RP_CONFIRM.page,
  CANCEL_RP_CONFIRM.uri,
  () => {},
  request => addLanguageCodeToUri(request, CANCEL_RP_COMPLETE.uri),
  getData
)

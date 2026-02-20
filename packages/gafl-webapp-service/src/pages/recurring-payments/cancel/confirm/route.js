import pageRoute from '../../../../routes/page-route.js'
import { CANCEL_RP_CONFIRM, CANCEL_RP_IDENTIFY } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { cacheDateFormat, dateDisplayFormat } from '../../../../processors/date-and-time-display.js'
import moment from 'moment-timezone'
import { nextPage } from '../../../../routes/next-page.js'

const getData = async request => {
  const { permission } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    licenceExpiry: moment(permission.endDate, cacheDateFormat, request.locale).format(dateDisplayFormat),
    uri: {
      cancelRpIdentify: addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri)
    }
  }
}

export default pageRoute(CANCEL_RP_CONFIRM.page, CANCEL_RP_CONFIRM.uri, null, nextPage, getData)

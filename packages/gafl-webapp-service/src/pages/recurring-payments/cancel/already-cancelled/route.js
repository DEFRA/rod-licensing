import pageRoute from '../../../../routes/page-route.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { CANCEL_RP_ALREADY_CANCELLED, CANCEL_RP_IDENTIFY, NEW_TRANSACTION } from '../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { cacheDateFormat, dateDisplayFormat } from '../../../../processors/date-and-time-display.js'
import moment from 'moment-timezone'

const getData = async request => {
  const {
    payload: { referenceNumber, endDate }
  } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const endDateString = moment(endDate, cacheDateFormat).tz(SERVICE_LOCAL_TIME).format(dateDisplayFormat)

  return {
    referenceNumber,
    endDate: endDateString,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(
  CANCEL_RP_ALREADY_CANCELLED.page,
  CANCEL_RP_ALREADY_CANCELLED.uri,
  () => {},
  () => {},
  getData
)

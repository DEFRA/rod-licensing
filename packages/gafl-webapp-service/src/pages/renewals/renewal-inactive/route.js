import { RENEWAL_INACTIVE, NEW_TRANSACTION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import moment from 'moment-timezone'
import { dateDisplayFormat, cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { RENEWAL_ERROR_REASON } from '../../../constants.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

export const getTitleAndBodyMessage = (mssgs, reason, referenceNumber, validTo) => {
  switch (reason) {
    case RENEWAL_ERROR_REASON.NOT_DUE:
      return {
        bodyMessage: `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_not_due_2}${validTo}`,
        title: mssgs.renewal_inactive_title_1
      }
    case RENEWAL_ERROR_REASON.EXPIRED:
      return {
        bodyMessage: `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_has_expired_1}${validTo}${mssgs.renewal_inactive_has_expired_2}`,
        title: mssgs.renewal_inactive_title_2
      }
    case RENEWAL_ERROR_REASON.NOT_ANNUAL:
      return {
        bodyMessage: `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_not_annual_1}`,
        title: mssgs.renewal_inactive_title_3
      }
    default:
      return {
        bodyMessage: '',
        title: ''
      }
  }
}

export const getData = async request => {
  const { referenceNumber, authentication } = await request.cache().helpers.status.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()
  const validTo = moment(authentication.endDate, cacheDateFormat, request.locale).format(dateDisplayFormat)
  const reason = authentication.reason
  const titleAndBodyMessage = getTitleAndBodyMessage(mssgs, reason, referenceNumber, validTo)

  return {
    ...titleAndBodyMessage,
    reason: authentication.reason,
    reasonCodes: RENEWAL_ERROR_REASON,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

export default pageRoute(RENEWAL_INACTIVE.page, RENEWAL_INACTIVE.uri, null, nextPage, getData)

import { RENEWAL_INACTIVE, NEW_TRANSACTION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import moment from 'moment'
import { dateDisplayFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { RENEWAL_ERROR_REASON } from '../../../constants.js'

export const getBodyMessage = (mssgs, reason, referenceNumber, validTo) => {
  switch (reason) {
    case RENEWAL_ERROR_REASON.NOT_DUE:
      return `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_not_due_2}${validTo}`
    case RENEWAL_ERROR_REASON.EXPIRED:
      return `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_has_expired_1}${validTo}${mssgs.renewal_inactive_has_expired_2}`
    case RENEWAL_ERROR_REASON.NOT_ANNUAL:
      return `${mssgs.renewal_inactive_not_due_1}${referenceNumber}${mssgs.renewal_inactive_not_annual_1}`
    default:
      return ''
  }
}

export const getData = async request => {
  const { referenceNumber, authentication } = await request.cache().helpers.status.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()
  const validTo = moment(authentication.endDate).format(dateDisplayFormat)
  const reason = authentication.reason
  const bodyMessage = getBodyMessage(mssgs, reason, referenceNumber, validTo)
  return {
    bodyMessage,
    reason: authentication.reason,
    reasonCodes: RENEWAL_ERROR_REASON,
    uri: {
      new: NEW_TRANSACTION.uri
    }
  }
}

export default pageRoute(RENEWAL_INACTIVE.page, RENEWAL_INACTIVE.uri, null, nextPage, getData)

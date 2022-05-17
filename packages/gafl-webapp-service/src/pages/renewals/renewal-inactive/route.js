import { RENEWAL_INACTIVE, NEW_TRANSACTION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import moment from 'moment'
import { dateDisplayFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'

export const getData = async request => {
  const { referenceNumber, authentication } = await request.cache().helpers.status.getCurrentPermission()
  return {
    referenceNumber,
    reason: authentication.reason,
    validTo: moment(authentication.endDate).format(dateDisplayFormat),
    uri: {
      new: NEW_TRANSACTION.uri
    }
  }
}

export default pageRoute(RENEWAL_INACTIVE.page, RENEWAL_INACTIVE.uri, null, nextPage, getData)

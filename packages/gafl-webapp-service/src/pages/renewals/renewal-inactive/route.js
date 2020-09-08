import { RENEWAL_INACTIVE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import moment from 'moment'
import { dateDisplayFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'

export default pageRoute(RENEWAL_INACTIVE.page, RENEWAL_INACTIVE.uri, null, nextPage, async request => {
  const { referenceNumber, authentication } = await request.cache().helpers.status.getCurrentPermission()
  return {
    referenceNumber,
    reason: authentication.reason,
    validTo: moment(authentication.endDate).format(dateDisplayFormat)
  }
})

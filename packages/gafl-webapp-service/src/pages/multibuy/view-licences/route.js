import pageRoute from '../../../routes/page-route.js'
import { VIEW_LICENCES } from '../../../uri.js'
import { licenceTypeDisplay, licenceLengthDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'

const getData = async request => {
  const transaction = await request.cache().helpers.transaction.get()

  const licences = transaction.permissions.map(permission => ({
    licenceHolder: `${permission.licensee.firstName} ${permission.licensee.lastName}`,
    type: licenceTypeDisplay(permission),
    length: licenceLengthDisplay(permission),
    start: displayStartTime(permission),
    price: permission.permit.cost
  }))
  return { licences }
}

export default pageRoute(VIEW_LICENCES.page, VIEW_LICENCES.uri, null, null, getData)

import pageRoute from '../../../routes/page-route.js'

import { LICENCE_INFORMATION } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime, displayEndTime } from '../../../processors/date-and-time-display.js'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const startTimeString = displayStartTime(permission)
  const endTimeString = displayEndTime(permission)

  return {
    permission,
    startTimeString,
    endTimeString,
    licenceTypeStr: licenceTypeDisplay(permission),  
  }
}

export default pageRoute(LICENCE_INFORMATION.page, LICENCE_INFORMATION.uri, null, nextPage, getData)

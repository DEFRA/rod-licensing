import Boom from '@hapi/boom'

import pageRoute from '../../../routes/page-route.js'
import { LICENCE_DETAILS } from '../../../uri.js'
import { COMPLETION_STATUS } from '../../../constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime, displayEndTime } from '../../../processors/date-and-time-display.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

const getData = async request => {
  const status = await request.cache().helpers.status.get()

  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden('Attempt to access the licence information handler with no agreed flag set')
  }

  if (!status[COMPLETION_STATUS.posted]) {
    throw Boom.forbidden('Attempt to access the licence information handler with no posted flag set')
  }

  if (!status[COMPLETION_STATUS.finalised]) {
    throw Boom.forbidden('Attempt to access the licence information handler with no finalised flag set')
  }

  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const startTimeString = displayStartTime(permission)
  const endTimeString = displayEndTime(permission)

  return {
    permission,
    startTimeString,
    endTimeString,
    disabled: concessionHelper.hasDisabled(permission),
    licenceTypeStr: licenceTypeDisplay(permission)
  }
}

export default pageRoute(LICENCE_DETAILS.page, LICENCE_DETAILS.uri, null, nextPage, getData)

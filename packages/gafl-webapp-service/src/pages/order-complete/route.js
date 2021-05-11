import pageRoute from '../../routes/page-route.js'

import Boom from '@hapi/boom'
import { COMPLETION_STATUS, FEEDBACK_URI_DEFAULT } from '../../constants.js'
import { ORDER_COMPLETE, NEW_TRANSACTION, REFUND_POLICY, ORDER_COMPLETE_PDF } from '../../uri.js'
import { displayStartTime, displayEndTime } from '../../processors/date-and-time-display.js'
import * as mappings from '../../processors/mapping-constants.js'
import * as concessionHelper from '../../processors/concession-helper.js'
import { licenceTypeDisplay, isPhysical } from '../../processors/licence-type-display.js'
import { nextPage } from '../../routes/next-page.js'

const getData = async request => {
  const status = await request.cache().helpers.status.get()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.agreed]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no agreed flag set')
  }

  // If the agreed flag is not set to true then throw an exception
  if (!status[COMPLETION_STATUS.posted]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no posted flag set')
  }

  // If the finalised flag has not been set throw an exception
  if (!status[COMPLETION_STATUS.finalised]) {
    throw Boom.forbidden('Attempt to access the completion page handler with no finalised flag set')
  }

  await request.cache().helpers.status.set({ [COMPLETION_STATUS.completed]: true })
  await request.cache().helpers.status.setCurrentPermission({ currentPage: ORDER_COMPLETE.page })

  const startTimeString = displayStartTime(permission)
  const endTimeString = displayEndTime(permission)

  return {
    permission,
    startTimeString,
    endTimeString,
    disabled: concessionHelper.hasDisabled(permission),
    licenceTypes: mappings.LICENCE_TYPE,
    hasJunior: concessionHelper.hasJunior(permission),
    hasSenior: concessionHelper.hasSenior(permission),
    licenceTypeStr: licenceTypeDisplay(permission),
    isPhysical: isPhysical(permission),
    contactMethod: permission.licensee.preferredMethodOfConfirmation,
    howContacted: mappings.HOW_CONTACTED,
    uri: {
      new: NEW_TRANSACTION.uri,
      refund: REFUND_POLICY.uri,
      pdf: ORDER_COMPLETE_PDF.uri,
      feedback: process.env.FEEDBACK_URI || FEEDBACK_URI_DEFAULT
    }
  }
}

export default pageRoute(ORDER_COMPLETE.page, ORDER_COMPLETE.uri, null, nextPage, getData)

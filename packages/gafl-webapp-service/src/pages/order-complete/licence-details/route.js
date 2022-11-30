import Boom from '@hapi/boom'

import pageRoute from '../../../routes/page-route.js'
import { LICENCE_DETAILS } from '../../../uri.js'
import { COMPLETION_STATUS } from '../../../constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime, displayEndTime } from '../../../processors/date-and-time-display.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

const getAgeConcessionText = (permission, catalog) => {
  if (concessionHelper.hasSenior(permission)) {
    return catalog.age_senior_concession
  }
  if (concessionHelper.hasJunior(permission)) {
    return catalog.age_junior_concession
  }
}

export const getData = async request => {
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

  const startTimeString = displayStartTime(request, permission)
  const endTimeString = displayEndTime(request, permission)
  const catalog = request.i18n.getCatalog()

  return {
    permission,
    startTimeString,
    endTimeString,
    disabled: concessionHelper.hasDisabled(permission),
    ageConcession: concessionHelper.getAgeConcession(permission),
    ageConcessionText: getAgeConcessionText(permission, catalog),
    licenceTypeStr: licenceTypeDisplay(permission, catalog)
  }
}

export default pageRoute(LICENCE_DETAILS.page, LICENCE_DETAILS.uri, null, nextPage, getData)

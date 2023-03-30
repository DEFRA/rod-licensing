import Boom from '@hapi/boom'

import pageRoute from '../../../routes/page-route.js'
import { LICENCE_DETAILS } from '../../../uri.js'
import { COMPLETION_STATUS } from '../../../constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime, displayEndTime } from '../../../processors/date-and-time-display.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import moment from 'moment-timezone'
import { SENIOR_AGE_CHANGE_DATE } from '@defra-fish/business-rules-lib'

export const getData = async request => {
  const mssgs = request.i18n.getCatalog()
  const transaction = await request.cache().helpers.transaction.get()
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

  const licences = transaction.permissions.map((permission, index) => ({
    referenceNumber: permission.referenceNumber,
    licenceHolder: `${permission.licensee.firstName} ${permission.licensee.lastName}`,
    obfuscatedDob: permission.licensee.obfuscatedDob,
    type: licenceTypeDisplay(permission, mssgs),
    length: licenceLengthText(permission, mssgs),
    start: displayStartTime(request, permission),
    end: displayEndTime(request, permission),
    price: permission.permit.cost,
    disabled: concessionHelper.hasDisabled(permission),
    ageConcession: getAgeConcessionText(permission, mssgs),
    index
  }))

  return {
    licences
  }
}

const getAgeConcessionText = (permission, catalog) => {
  if (concessionHelper.hasSenior(permission)) {
    if (moment(permission.startDate).isSameOrAfter(SENIOR_AGE_CHANGE_DATE)) {
      return catalog.age_senior_concession_new
    }
    return catalog.age_senior_concession
  }
  if (concessionHelper.hasJunior(permission)) {
    return catalog.age_junior_concession
  }
  return false
}

const licenceLengthText = (permission, mssgs) => {
  const length = licenceTypeAndLengthDisplay(permission, mssgs)

  if (length.includes('1 day')) {
    return mssgs.licence_type_1d
  } else if (length.includes('8 days')) {
    return mssgs.licence_type_8d
  }

  return mssgs.licence_type_12m
}

export default pageRoute(LICENCE_DETAILS.page, LICENCE_DETAILS.uri, null, nextPage, getData)

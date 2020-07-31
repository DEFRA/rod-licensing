import moment from 'moment'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import findPermit from '../find-permit.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import * as mappings from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { getTrackingProductDetailsFromTransaction } from '../../../processors/analytics.js'
import {
  LICENCE_SUMMARY,
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  DATE_OF_BIRTH,
  RENEWAL_START_DATE,
  NEW_TRANSACTION
} from '../../../uri.js'

import { LICENCE_SUMMARY_SEEN } from '../../../constants.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!status.renewal) {
    /*
     * Before we try and filter the permit it is necessary to check that the user has navigated through
     * the journey in such a way as to have gather all the required data. They may have manipulated the
     * journey by typing into the address bar in which case they will be redirected back to the
     * appropriate point in the journey. For a renewal this is not necessary.
     */
    if (!permission.licensee.birthDate) {
      throw new GetDataRedirect(DATE_OF_BIRTH.uri)
    }

    if (!permission.licenceStartDate) {
      throw new GetDataRedirect(LICENCE_TO_START.uri)
    }

    if (!permission.numberOfRods || !permission.licenceType) {
      throw new GetDataRedirect(LICENCE_TYPE.uri)
    }

    if (!permission.licenceLength) {
      throw new GetDataRedirect(LICENCE_LENGTH.uri)
    }
  }

  status.fromSummary = status.fromSummary || LICENCE_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  await findPermit(permission, request)
  const startTimeString = displayStartTime(permission)
  const transaction = await request.cache().helpers.transaction.get()
  await request.ga.ecommerce().detail(getTrackingProductDetailsFromTransaction(transaction))

  return {
    permission,
    licenceTypeStr: licenceTypeDisplay(permission),
    startTimeString,
    isRenewal: status.renewal,
    isContinuing: !!(permission.renewedEndDate && permission.renewedEndDate === permission.licenceStartDate),
    hasExpired: moment(moment()).isAfter(moment(permission.renewedEndDate, 'YYYY-MM-DD')),
    disabled: permission.concessions ? permission.concessions.find(c => c.type === mappings.CONCESSION.DISABLED) : null,
    hasJunior: !!concessionHelper.hasJunior(permission),
    cost: permission.permit.cost,
    birthDateStr: moment(permission.licensee.birthDate, 'YYYY-MM-DD').format('LL'),
    uri: {
      licenceLength: LICENCE_LENGTH.uri,
      licenceType: LICENCE_TYPE.uri,
      licenceToStart: LICENCE_TO_START.uri,
      dateOfBirth: DATE_OF_BIRTH.uri,
      disabilityConcession: DISABILITY_CONCESSION.uri,
      licenceStartDate: status.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
      clear: NEW_TRANSACTION.uri
    }
  }
}

export default pageRoute(LICENCE_SUMMARY.page, LICENCE_SUMMARY.uri, null, CONTROLLER.uri, getData)

import moment from 'moment'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import findPermit from '../find-permit.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import * as mappings from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { getTrackingProductDetailsFromTransaction } from '../../../processors/analytics.js'
import {
  LICENCE_SUMMARY,
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  NUMBER_OF_RODS,
  BENEFIT_CHECK,
  DATE_OF_BIRTH,
  LICENCE_START_DATE,
  RENEWAL_START_DATE
} from '../../../uri.js'

// Redirects back to page if incomplete
const checkPageCompleted = (p, status) => {
  if (!status[p.page]) {
    throw new GetDataRedirect(p.uri)
  }
}

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!status.renewal) {
    /*
     * Before we try and filter the permit it is necessary to check that the user has navigated through
     * the journey in such a way as to have gather all the required data. They have have manipulated the
     * journey by typing into the address bar in which case they will be redirected back to the
     * appropriate point in the journey. For a renewal this is not necessary
     */
    checkPageCompleted(LICENCE_LENGTH, status)
    checkPageCompleted(LICENCE_TYPE, status)

    if (!permission.numberOfRods) {
      throw new GetDataRedirect(LICENCE_TYPE.uri)
    }

    if (!permission.licenceStartDate) {
      throw new GetDataRedirect(LICENCE_TO_START.uri)
    }

    checkPageCompleted(DATE_OF_BIRTH, status)
  }

  status.fromSummary = status.fromSummary || 'licence-summary'
  await request.cache().helpers.status.setCurrentPermission(status)

  await findPermit(permission, request)

  const startTimeString = displayStartTime(permission)

  const transaction = await request.cache().helpers.transaction.get()
  await request.ga.ecommerce().detail(
    getTrackingProductDetailsFromTransaction(transaction)
  )

  return {
    permission,
    startTimeString,
    isRenewal: status.renewal,
    isContinuing: !!(permission.renewedEndDate && permission.renewedEndDate === permission.licenceStartDate),
    hasExpired: moment(moment()).isAfter(moment(permission.renewedEndDate, 'YYYY-MM-DD')),
    disabled: permission.concessions ? permission.concessions.find(c => c.type === mappings.CONCESSION.DISABLED) : null,
    licenceTypes: mappings.LICENCE_TYPE,
    hasJunior: !!concessionHelper.hasJunior(permission),
    hasSenior: !!concessionHelper.hasSenior(permission),
    cost: permission.permit.cost,
    birthDateStr: moment(permission.licensee.birthDate, 'YYYY-MM-DD').format('LL'),
    uri: {
      licenceLength: LICENCE_LENGTH.uri,
      licenceType: LICENCE_TYPE.uri,
      numberOfRods: NUMBER_OF_RODS.uri,
      licenceToStart: LICENCE_TO_START.uri,
      dateOfBirth: DATE_OF_BIRTH.uri,
      benefitCheck: BENEFIT_CHECK.uri,
      licenceStartDate: status.renewal ? RENEWAL_START_DATE.uri : LICENCE_START_DATE.uri // Differing validation
    }
  }
}

export default pageRoute(LICENCE_SUMMARY.page, LICENCE_SUMMARY.uri, null, CONTROLLER.uri, getData)

import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { licenceTypeDisplay, getErrorPage } from '../../../processors/licence-type-display.js'
import { displayStartTime, cacheDateFormat } from '../../../processors/date-and-time-display.js'
import findPermit from '../../summary/find-permit.js'
import { CHANGE_LICENCE_OPTIONS_SEEN } from '../../../constants.js'
import moment from 'moment-timezone'
import {
  NAME,
  CHANGE_LICENCE_OPTIONS,
  CHANGE_CONTACT_DETAILS,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  DATE_OF_BIRTH,
  RENEWAL_START_DATE,
  NEW_TRANSACTION
} from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'
import { START_AFTER_PAYMENT_MINUTES, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { CONCESSION, CONCESSION_PROOF } from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

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
    const errorOnPage = getErrorPage(permission)
    if (errorOnPage) {
      throw new GetDataRedirect(errorOnPage)
    }
  }

  status.fromLicenceOptions = CHANGE_LICENCE_OPTIONS_SEEN.SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  await findPermit(permission, request)
  const startTimeString = displayStartTime(request, permission)

  return {
    permission,
    startTimeString,
    startAfterPaymentMinutes: START_AFTER_PAYMENT_MINUTES,
    licenceTypeStr: licenceTypeDisplay(permission, request.i18n.getCatalog()),
    isRenewal: status.renewal,
    isContinuing: !!(permission.renewedEndDate && permission.renewedEndDate === permission.licenceStartDate),
    hasExpired: moment(moment().tz(SERVICE_LOCAL_TIME)).isAfter(moment(permission.renewedEndDate, cacheDateFormat)),
    disabled: permission.concessions && permission.concessions.find(c => c.type === CONCESSION.DISABLED),
    concessionProofs: CONCESSION_PROOF,
    hasJunior: concessionHelper.hasJunior(permission),
    cost: permission.permit.cost,
    birthDateStr: moment(permission.licensee.birthDate, cacheDateFormat).format('Do MMMM YYYY'),
    uri: {
      name: NAME.uri,
      licenceLength: LICENCE_LENGTH.uri,
      licenceType: LICENCE_TYPE.uri,
      licenceToStart: LICENCE_TO_START.uri,
      dateOfBirth: DATE_OF_BIRTH.uri,
      disabilityConcession: DISABILITY_CONCESSION.uri,
      licenceStartDate: status.renewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri,
      clear: NEW_TRANSACTION.uri,
      changeContactDetails: CHANGE_CONTACT_DETAILS.uri
    }
  }
}

export default pageRoute(CHANGE_LICENCE_OPTIONS.page, CHANGE_LICENCE_OPTIONS.uri, null, nextPage, getData)

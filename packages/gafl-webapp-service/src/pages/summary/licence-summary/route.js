import moment from 'moment'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import findPermit from '../find-permit.js'
import * as mappings from '../../../processors/mapping-constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import {
  LICENCE_SUMMARY,
  CONTROLLER,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  NUMBER_OF_RODS,
  CONTACT_SUMMARY
} from '../../../constants.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  /*
   * Before we try and filter the permit it is necessary to check that the user has navigated through
   * the journey in such a way as to have gather all the required data. They have have manipulated the
   * journey by typing into the address bar in which case they will be redirected back to the
   * appropriate point in the journey
   */
  if (!status[LICENCE_LENGTH.page]) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  if (!status[LICENCE_TYPE.page]) {
    throw new GetDataRedirect(LICENCE_TYPE.uri)
  }

  if (!permission.numberOfRods) {
    throw new GetDataRedirect(LICENCE_TYPE.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  status.fromSummary = true
  await request.cache().helpers.status.setCurrentPermission(status)

  await findPermit(permission, request)

  // Is this date format ok?
  const startTimeString = moment(permission.licenceStartDate, 'YYYY-MM-DD')
    .add(permission.licenceStartTime, 'hours')
    .format('LLLL')

  return {
    permission,
    startTimeString,
    licenceTypes: mappings.LICENCE_TYPE,
    hasJunior: !!concessionHelper.hasJunior(permission.licensee),
    uri: {
      licenceLength: LICENCE_LENGTH.uri,
      licenceType: LICENCE_TYPE.uri,
      numberOfRods: NUMBER_OF_RODS.uri,
      contactSummary: CONTACT_SUMMARY.uri,
      licenceToStart: LICENCE_TO_START.uri
    }
  }
}

export default pageRoute(LICENCE_SUMMARY.page, LICENCE_SUMMARY.uri, null, CONTROLLER.uri, getData)

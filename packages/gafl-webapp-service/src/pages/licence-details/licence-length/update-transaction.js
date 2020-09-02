import * as mappings from '../../../processors/mapping-constants.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { LICENCE_LENGTH } from '../../../uri.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { licenceToStart } from '../licence-to-start/update-transaction.js'
import moment from 'moment'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Setting the licence length to anything other that 12 months removes disabled concessions
  if (payload['licence-length'] !== '12M') {
    concessionHelper.removeDisabled(permission)
    if (permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
      permission.numberOfRods = '2'
    }
  } else {
    permission.licenceStartTime = null
    // If the licence start date has previously be chosen as today, for a 12 month
    // then set start after payment
    if (
      moment(permission.licenceStartDate, 'YYYY-MM-DD')
        .tz(SERVICE_LOCAL_TIME)
        .isSame(moment(), 'day')
    ) {
      permission.licenceToStart = licenceToStart.AFTER_PAYMENT
    }
  }

  permission.licenceLength = payload['licence-length']
  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

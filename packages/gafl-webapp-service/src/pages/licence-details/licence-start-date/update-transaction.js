import moment from 'moment'
import { LICENCE_START_DATE } from '../../../constants.js'
import * as concessionHelper from '../../../processors/concession-helper.js'

/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_START_DATE.page)

  const licenceStartDate = moment({
    year: payload['licence-start-date-year'],
    month: Number.parseInt(payload['licence-start-date-month']) - 1,
    day: payload['licence-start-date-day']
  }).format('YYYY-MM-DD')

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.licenceStartDate = licenceStartDate

  // Remove any junior or senior concessions when selecting a licence start date
  concessionHelper.removeJunior(permission.licensee)
  concessionHelper.removeSenior(permission.licensee)

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

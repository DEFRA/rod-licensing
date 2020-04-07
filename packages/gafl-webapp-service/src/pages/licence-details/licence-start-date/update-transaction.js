import moment from 'moment'
import { LICENCE_START_DATE, CONCESSION } from '../../../constants.js'

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
  const result = { licenceStartDate }

  // Remove any junior or senior concessions when selecting a licence start date
  if (permission.concession && [CONCESSION.JUNIOR, CONCESSION.SENIOR].includes(permission.concession.type)) {
    Object.assign(result, { concession: {} })
  }

  await request.cache().helpers.transaction.setCurrentPermission(result)
}

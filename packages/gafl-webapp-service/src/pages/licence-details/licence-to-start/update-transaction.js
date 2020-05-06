import moment from 'moment'
import { LICENCE_TO_START } from '../../../uri.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TO_START.page)
  const permission = { licenceToStart: payload['licence-to-start'] }
  if (payload['licence-to-start'] === 'after-payment') {
    Object.assign(permission, { licenceStartDate: moment().format('YYYY-MM-DD') })
  }
  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

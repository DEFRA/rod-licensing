import db from 'debug'
import { COMPLETION_STATUS } from '../../constants.js'
import { validForRecurringPayment } from '../../processors/recurring-pay-helper.js'
const debug = db('webapp:set-agreed')

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (validForRecurringPayment(permission)) {
    debug('Recurring payment valid option')
  } else {
    debug('Setting status to agreed')
    await request.cache().helpers.status.set({ [COMPLETION_STATUS.agreed]: true })
  }
}

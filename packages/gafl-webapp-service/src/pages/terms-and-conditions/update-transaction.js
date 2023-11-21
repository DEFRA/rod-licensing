import db from 'debug'
import { COMPLETION_STATUS } from '../../constants.js'
const debug = db('webapp:set-agreed')

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (process.env.SHOW_RECURRING_PAYMENTS?.toLowerCase() === 'true' && permission.licenceLength === '12M') {
    debug('Recurring payment valid option')
  }
  debug('Setting status to agreed')
  await request.cache().helpers.status.set({ [COMPLETION_STATUS.agreed]: true })
}

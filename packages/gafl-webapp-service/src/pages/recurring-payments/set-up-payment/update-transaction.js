import db from 'debug'
import { COMPLETION_STATUS, RECURRING_PAYMENT } from '../../../constants.js'
const debug = db('webapp:set-agreed')

export default async request => {
  debug('Setting status to agreed')
  await request.cache().helpers.status.set({ [COMPLETION_STATUS.agreed]: true, [RECURRING_PAYMENT]: true })
}

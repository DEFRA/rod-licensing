import db from 'debug'
import { COMPLETION_STATUS } from '../../../constants.js'
import { CHOOSE_PAYMENT } from '../../../uri.js'
const debug = db('webapp:set-agreed')

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CHOOSE_PAYMENT.page)

  if (payload['recurring-payment'] === 'no') {
    console.log('hit')
    debug('Setting status to agreed')
    await request.cache().helpers.status.set({ [COMPLETION_STATUS.agreed]: true })
  }
}

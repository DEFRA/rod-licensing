import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('webapp:cancel-rp-agreed')

export default async request => {
  const { recurringPayment } = await request.cache().helpers.transaction.getCurrentPermission()
  const recurringPaymentId = recurringPayment?.id

  try {
    await salesApi.cancelRecurringPayment(recurringPaymentId, 'User Cancelled')
    debug('Successfully cancelled recurring payment', recurringPaymentId)
  } catch (e) {
    debug('Error sending cancellation to Sales API', recurringPaymentId)
    throw e
  }
}

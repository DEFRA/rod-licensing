import { salesApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('webapp:cancel-rp-agreed')

export default async request => {
  console.log('🟡 CANCEL RP UPDATE-TRANSACTION: Starting cancellation process')
  const { recurringPayment } = await request.cache().helpers.transaction.getCurrentPermission()
  const recurringPaymentId = recurringPayment?.id
  console.log('🟡 CANCEL RP UPDATE-TRANSACTION: Recurring payment ID:', recurringPaymentId)

  try {
    console.log('🟡 CANCEL RP UPDATE-TRANSACTION: Calling salesApi.cancelRecurringPayment...')
    await salesApi.cancelRecurringPayment(recurringPaymentId, 'User Cancelled')
    console.log('🟢 CANCEL RP UPDATE-TRANSACTION: Successfully cancelled recurring payment', recurringPaymentId)
    debug('Successfully cancelled recurring payment', recurringPaymentId)
  } catch (e) {
    console.log('🔴 CANCEL RP UPDATE-TRANSACTION: Error sending cancellation to Sales API', recurringPaymentId, e)
    debug('Error sending cancellation to Sales API', recurringPaymentId)
    throw e
  }
}
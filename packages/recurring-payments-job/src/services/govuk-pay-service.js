import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('recurring-payments:gov.uk-pay-service')

export const queueRecurringPayment = (preparedPayment, batcher) => govUkPayApi.queueRecurringPayment(preparedPayment, batcher)
export const queueRecurringPaymentStatusCheck = (paymentId, batcher) => govUkPayApi.queueRecurringPaymentStatusCheck(paymentId, batcher)

export const isGovPayUp = async () => {
  const response = await govUkPayApi.isGovPayUp()
  if (response.ok) {
    const isHealthy = JSON.parse(await response.text())
    return isHealthy.ping.healthy && isHealthy.deadlocks.healthy
  }
  debug('Health endpoint unavailable')
  return false
}

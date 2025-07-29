import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('recurring-payments:gov.uk-pay-service')

export const sendPayment = async preparedPayment => {
  try {
    const response = await govUkPayApi.createPayment(preparedPayment, true)
    return await response.json()
  } catch (e) {
    console.error('Error creating payment', preparedPayment.id)
    throw e
  }
}

export const getPaymentStatus = async paymentId => {
  if (!paymentId) {
    throw new Error('Invalid payment ID')
  }

  try {
    const response = await govUkPayApi.fetchPaymentStatus(paymentId, true)

    if (!response.ok) {
      const errorDetails = await response.json()
      console.log(errorDetails)
      throw new Error(errorDetails.error || 'Error fetching payment status')
    }

    const paymentStatus = await response.json()
    return paymentStatus
  } catch (error) {
    console.error('Error in getPaymentStatus:', error)
    throw error
  }
}

export const isGovPayUp = async () => {
  const response = await govUkPayApi.isGovPayUp()
  if (response.ok) {
    const isHealthy = JSON.parse(await response.text())
    return isHealthy.ping.healthy && isHealthy.deadlocks.healthy
  }
  debug('Health endpoint unavailable')
  return false
}

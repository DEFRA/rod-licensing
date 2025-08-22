import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('recurring-payments:gov.uk-pay-service')

export const sendPayment = async preparedPayment => {
  const createPayment = async () => {
    try {
      return await govUkPayApi.createPayment(preparedPayment, true)
    } catch (e) {
      console.error('Error creating payment', preparedPayment.id)
      throw e
    }
  }
  const response = await createPayment()
  if (!response.ok) {
    console.error({
      method: 'POST',
      status: response.status,
      response: await response.json(),
      transactionId: preparedPayment.id,
      payload: preparedPayment
    })
    throw new Error('Unexpected response from GOV.UK Pay API')
  }
  return response.json()
}

export const getPaymentStatus = async paymentId => {
  if (!paymentId) {
    throw new Error('Invalid payment ID')
  }

  const fetchPaymentStatus = async () => {
    try {
      return await govUkPayApi.fetchPaymentStatus(paymentId, true)
    } catch (e) {
      console.error('Error fetching payment status', paymentId)
      throw e
    }
  }

  const response = await fetchPaymentStatus()

  throw new Error('Throwing this error for the sake of testing!')

  if (!response.ok) {
    console.error({
      method: 'GET',
      status: response.status,
      response: await response.json(),
      paymentId
    })
    throw new Error('Unexpected response from GOV.UK Pay API')
  }

  return response.json()
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

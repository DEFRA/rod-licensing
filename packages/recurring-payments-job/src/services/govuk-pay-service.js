import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('recurring-payments:gov.uk-pay-service')

export const sendPayment = async preparedPayment => {
  const createPayment = () => govUkPayApi.createPayment(preparedPayment, true)
  const response = await createPayment()
  if (!response.ok) {
    throw new Error(`Unexpected response from GOV.UK Pay API. 
      Status: ${response.status}, 
      Response: ${await response.json()}
      Transaction ID: ${preparedPayment.id}
      Payload: ${preparedPayment}
    `)
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

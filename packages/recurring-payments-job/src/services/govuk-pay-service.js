import { govUkPayApi } from '@defra-fish/connectors-lib'

export const sendPayment = preparedPayment => {
  govUkPayApi.createPayment(preparedPayment, true)
}

export const getPaymentStatus = async paymentId => {
  if (!paymentId) {
    throw new Error('Invalid payment ID')
  }

  const response = await govUkPayApi.fetchPaymentStatus(paymentId, true)

  if (!response.ok) {
    const errorDetails = await response.json()
    throw new Error(errorDetails.error || 'Error fetching payment status')
  }

  const paymentStatus = await response.json()
  return paymentStatus
}

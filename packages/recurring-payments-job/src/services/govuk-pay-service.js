import { govUkPayApi } from '@defra-fish/connectors-lib'

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

  const response = await govUkPayApi.fetchPaymentStatus(paymentId, true)

  if (!response.ok) {
    const errorDetails = await response.json()
    throw new Error(errorDetails.error || 'Error fetching payment status')
  }

  const paymentStatus = await response.json()
  return paymentStatus
}

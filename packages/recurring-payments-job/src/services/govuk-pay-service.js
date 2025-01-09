import { govUkPayApi } from '@defra-fish/connectors-lib'

export const sendPayment = async preparedPayment => {
  try {
    govUkPayApi.createPayment(preparedPayment, true)
  } catch (e) {
    console.error('Error creating payment', preparedPayment.id)
    throw e
  }
}

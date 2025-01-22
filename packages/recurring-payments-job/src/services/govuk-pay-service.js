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

import { govUkPayApi } from '@defra-fish/connectors-lib'

export const sendPayment = preparedPayment => {
  govUkPayApi.createPayment(preparedPayment, true)
}

export const getPaymentStatus = async preparedPayment => {
  const status = await govUkPayApi.fetchPaymentStatus(preparedPayment.reference.transaction.id, true)
  console.log('Recurring payment status:', status)
}

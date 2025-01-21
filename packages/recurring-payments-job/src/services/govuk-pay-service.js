import { govUkPayApi } from '@defra-fish/connectors-lib'

export const sendPayment = preparedPayment => {
  govUkPayApi.createPayment(preparedPayment, true)
}

export const getPaymentStatus = paymentId => {
  govUkPayApi.fetchPaymentStatus(paymentId, true)
}

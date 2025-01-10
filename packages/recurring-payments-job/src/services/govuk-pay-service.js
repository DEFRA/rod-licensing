import { govUkPayApi } from '@defra-fish/connectors-lib'

export const sendPayment = async preparedPayment => {
  govUkPayApi.createPayment(preparedPayment, true)
}

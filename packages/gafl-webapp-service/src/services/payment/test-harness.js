import mockTransaction from './__test__/data/mock-transaction.js'
import { postData, preparePayment } from './govuk-pay-service.js'

const init = async () => {
  const preparedPayment = preparePayment(mockTransaction)
  const payment = await postData(preparedPayment)
  console.log(payment)
}

init()

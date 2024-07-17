import { getRecurringPayments, processRecurringPayment } from '../../services/recurring-payments.service.js'
import { preparePayment } from '../../../../gafl-webapp-service/src/processors/payment.js'
import { sendPayment } from '../../../../gafl-webapp-service/src/services/payment/govuk-pay-service.js'

export default [
  {
    method: 'GET',
    path: '/dueRecurringPayments/{date}',
    handler: async (request, h) => {
      const { date } = request.params
      const result = await getRecurringPayments(date)
      return h.response(result)
    }
  },
  {
    method: 'POST',
    path: '/processRecurringPayment',
    handler: async (request, h) => {
      try {
        const { transactionRecord, contact } = request.payload
        const { recurringPayment } = await processRecurringPayment(transactionRecord, contact)

        if (!recurringPayment) {
          return h.response({ error: 'No recurring payment found' }).code(404)
        }

        const preparedPayment = preparePayment(request, recurringPayment)
        const paymentResponse = await sendPayment(preparedPayment)

        return h.response(paymentResponse)
      } catch (error) {
        console.error('Error processing recurring payment:', error)
        return h.response({ error: 'Failed to process recurring payment' }).code(500)
      }
    }
  }
]

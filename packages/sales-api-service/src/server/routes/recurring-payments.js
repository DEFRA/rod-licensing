import { dueRecurringPaymentsResponseSchema } from '../../schema/recurring-payments.schema.js'
import { getRecurringPayments, processRPResult } from '../../services/recurring-payments.service.js'

export default [
  {
    method: 'GET',
    path: '/dueRecurringPayments/{date}',
    options: {
      handler: async (request, h) => {
        const { date } = request.params
        const result = await getRecurringPayments(date)
        return h.response(result)
      },
      description: 'Retrieve recurring payments due for the specified date',
      tags: ['api', 'recurring-payments'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payments due', schema: dueRecurringPaymentsResponseSchema }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/processRPResult/{transactionId}/{paymentId}/{createdDate}',
    options: {
      handler: async (request, h) => {
        const { transactionId, paymentId, createdDate } = request.params
        const result = await processRPResult(transactionId, paymentId, createdDate)
        return h.response(result)
      },
      description: 'Generate a permission from a recurring payment record',
      tags: ['api', 'recurring-payments'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'New permission from recurring payment record generated successfully' }
          },
          order: 2
        }
      }
    }
  }
]

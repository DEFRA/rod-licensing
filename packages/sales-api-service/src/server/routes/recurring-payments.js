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
    method: 'POST',
    path: '/processRPResult/{transaction}',
    options: {
      handler: async (request, h) => {
        const { transaction } = request.params
        await processRPResult(transaction)
      },
      description: 'Generate a recurring payment record',
      tags: ['api', 'recurring-payments'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payment record generated successfully' }
          },
          order: 2
        }
      }
    }
  }
]

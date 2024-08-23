import { getRecurringPayments } from '../../services/recurring-payments.service.js'
import { recurringPaymentsResponseSchema } from '../../schema/recurring-payments-schema.js'

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
      description: 'Retrieve recurring payments due on provided date',
      notes: 'Returns the list of recurring payments that are due on the provided date',
      tags: ['api', 'recurring-payments'],
      validate: {
        params: recurringPaymentsResponseSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'List of due recurring payments', schema: recurringPaymentsResponseSchema },
            400: { description: 'Invalid date format' }
          },
          order: 1
        }
      }
    }
  }
]

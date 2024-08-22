import { recurringPaymentsSchema } from '../../schema/recurring-payments.schema.js'
import { getRecurringPayments } from '../../services/recurring-payments.service.js'
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
      description: 'Gets the recurring payments due on the specified day',
      notes: `
        Gets the recurring payments due on the specified day
      `,
      tags: ['api', 'recurring-payments'],
      validate: {
        params: recurringPaymentsSchema
      },
      plugins : {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payments due retrieved successfully', schema: recurringPaymentsSchema },
            401: { description: 'Unable to retrieve due recurring payments' }
          },
          order: 1
        }
      }
    }
  }
]

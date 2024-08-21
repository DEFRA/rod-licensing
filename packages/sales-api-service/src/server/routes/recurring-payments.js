import { getRecurringPayments } from '../../services/recurring-payments.service.js'
import { recurringPaymentsRequestParamsSchema, recurringPaymentsResponseSchema } from '../../schema/recurring-payments-schema.js'
import Joi from 'joi'

export default [
  {
    method: 'GET',
    path: '/dueRecurringPayments/{date}',
    options: {
      handler: async (request, h) => {
        const { date } = request.params
        const result = await getRecurringPayments(date)

        const { error, value } = recurringPaymentsResponseSchema.validate(result)
        if (error) {
          throw new Joi.ValidationError('Response validation failed', error.details, value)
        }

        return h.response(value).code(200)
      },
      description: 'Retrieve recurring payments due on provided date',
      notes: 'This returns the list of recurring payments that are due on the provided date.',
      tags: ['api', 'recurring-payments'],
      validate: {
        params: recurringPaymentsRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'List of due recurring payments', schema: recurringPaymentsResponseSchema },
            400: { description: 'Invalid date format' }
          },
          order: 2
        }
      }
    }
  }
]

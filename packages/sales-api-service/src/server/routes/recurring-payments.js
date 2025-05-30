import {
  dueRecurringPaymentsRequestParamsSchema,
  dueRecurringPaymentsResponseSchema,
  processRPResultRequestParamsSchema,
  cancelRecurringPaymentRequestParamsSchema
} from '../../schema/recurring-payments.schema.js'
import { getRecurringPayments, processRPResult, cancelRecurringPayment } from '../../services/recurring-payments.service.js'

const SWAGGER_TAGS = ['api', 'recurring-payments']

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
      tags: SWAGGER_TAGS,
      validate: {
        params: dueRecurringPaymentsRequestParamsSchema
      },
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
      tags: SWAGGER_TAGS,
      validate: {
        params: processRPResultRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'New permission from recurring payment record generated successfully' }
          },
          order: 2
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/cancelRecurringPayment/{id}',
    options: {
      handler: async (request, h) => {
        const { id } = request.params
        const result = await cancelRecurringPayment(id)
        return h.response(result)
      },
      description: 'Cancel a recurring payment',
      tags: SWAGGER_TAGS,
      validate: {
        params: cancelRecurringPaymentRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payment cancelled' }
          },
          order: 3
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/cancelRecurringPayment/{id}',
    options: {
      handler: async (request, h) => {
        const { id } = request.params
        const result = await cancelRecurringPayment(id)
        return h.response(result)
      },
      description: 'Cancel a recurring payment',
      tags: SWAGGER_TAGS,
      validate: {
        params: cancelRecurringPaymentRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payment cancelled' }
          },
          order: 4
        }
      }
    }
  }
]

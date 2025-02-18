import { dueRecurringPaymentsResponseSchema } from '../../schema/recurring-payments.schema.js'
import { generateRecurringPaymentRecord, getRecurringPayments, processRecurringPayment } from '../../services/recurring-payments.service.js'
import { createRecurringPaymentPermission } from '../../services/permissions.service.js'

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
    path: '/generateRecurringPaymentRecord/{transactionRecord}/{permission}',
    options: {
      handler: async (request, h) => {
        const { transactionRecord, permission } = request.params
        const result = generateRecurringPaymentRecord(transactionRecord, permission)
        return h.response(result)
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
  },
  {
    method: 'GET',
    path: '/processRecurringPayment/{transactionRecord}/{contact}',
    options: {
      handler: async (request, h) => {
        const { transactionRecord, contact } = request.params
        const result = await processRecurringPayment(transactionRecord, contact)
        return h.response(result)
      },
      description: 'Process a recurring payment instruction',
      tags: ['api', 'recurring-payments'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payment processed successfully' }
          },
          order: 3
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/createRecurringPaymentPermission',
    options: {
      handler: async (request, h) => {
        const permissionData = request.payload
        const result = await createRecurringPaymentPermission(permissionData)
        return h.response(result)
      },
      description: 'Create a new permission after recurring payment is processed',
      tags: ['api', 'permissions'],
      plugins: {
        'hapi-swagger': {
          responses: {
            201: { description: 'Permission created successfully' }
          },
          order: 4
        }
      }
    }
  }
]

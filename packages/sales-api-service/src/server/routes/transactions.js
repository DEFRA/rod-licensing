import Joi from '@hapi/joi'
import { newTransaction, completeTransaction, processQueue, processDlq } from '../../services/transactions.service.js'
import { createTransactionSchema, createTransactionResponseSchema } from '../../schema/transaction.schema.js'

const stagingIdSchema = Joi.object({
  id: Joi.string()
    .trim()
    .min(1)
    .required()
    .description('the staging identifier')
})

export default [
  {
    method: 'POST',
    path: '/transactions',
    options: {
      handler: async (request, h) => h.response(await newTransaction(request.payload)).code(201),
      description: 'Create a new transaction',
      notes: `
      Creates a new transaction, generating properties such as permission numbers.  The transaction will not be completed until payment data
      has been added using the PATCH operation
      `,
      tags: ['api', 'transactions'],
      validate: {
        payload: createTransactionSchema
      },
      response: {
        status: {
          201: createTransactionResponseSchema
        }
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            201: { description: 'Transaction created', schema: createTransactionResponseSchema },
            422: { description: 'Invalid request payload' }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'PATCH',
    path: '/transactions/{id}',
    options: {
      handler: async (request, h) => h.response(await completeTransaction({ id: request.params.id, ...request.payload })).code(200),
      description: 'Complete an existing transaction',
      notes: `
        Marks an existing transaction as complete at which point it will become eligible for insertion into Dynamics.
      `,
      tags: ['api', 'transactions'],
      validate: {
        params: stagingIdSchema
        // TODO: Determine what the payment payload will be..
        // payload: createTransactionSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            204: { description: 'Transaction accepted' },
            400: { description: 'Invalid request params' },
            404: { description: 'Transaction ID not found' },
            422: { description: 'Invalid request payload' }
          },
          order: 2
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/process-queue/transactions',
    options: {
      handler: async (request, h) => h.response(await processQueue(request.payload)).code(204),
      description: 'Process a transaction from the transaction staging queue',
      notes: 'Process a transaction from the transaction staging queue',
      tags: ['api', 'transactions'],
      validate: {
        payload: stagingIdSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            204: { description: 'Transaction message processed' },
            422: { description: 'Invalid request payload' }
          },
          order: 3
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/process-dlq/transactions',
    options: {
      handler: async (request, h) => h.response(await processDlq(request.payload)).code(204),
      description: 'Process a transaction from the transaction dead letter queue',
      notes: 'Process a transaction from the transaction dead letter queue',
      tags: ['api', 'transactions'],
      validate: {
        payload: stagingIdSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            204: { description: 'Failure processed successfully' },
            422: { description: 'Invalid request payload' }
          },
          order: 4
        }
      }
    }
  }
]

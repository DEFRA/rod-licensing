import Joi from '@hapi/joi'
import { createTransaction, finaliseTransaction, processQueue, processDlq } from '../../services/transactions/transactions.service.js'
import { createTransactionSchema, createTransactionResponseSchema, finaliseTransactionSchema } from '../../schema/transaction.schema.js'

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
      handler: async (request, h) => h.response(await createTransaction(request.payload)).code(201),
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
            422: { description: 'The new transaction payload was invalid' }
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
      handler: async (request, h) => h.response(await finaliseTransaction({ id: request.params.id, ...request.payload })).code(200),
      description: 'Finalise an existing transaction',
      notes: `
        Marks an existing transaction as finalised at which point it will become eligible for insertion into Dynamics.
      `,
      tags: ['api', 'transactions'],
      validate: {
        params: stagingIdSchema,
        payload: finaliseTransactionSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Transaction accepted' },
            400: { description: 'Invalid request params' },
            404: { description: 'A transaction for the specified identifier was not found' },
            422: { description: 'The transaction completion payload was invalid' }
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
            404: { description: 'A transaction for the specified identifier was not found' },
            422: { description: 'The transaction queue processing payload was invalid' }
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
            422: { description: 'The transaction dlq processing payload was invalid' }
          },
          order: 4
        }
      }
    }
  }
]

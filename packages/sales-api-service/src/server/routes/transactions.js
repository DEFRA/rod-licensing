import Joi from 'joi'
import Boom from '@hapi/boom'
import {
  createTransaction,
  createTransactions,
  finaliseTransaction,
  processQueue,
  processDlq,
  updateTransactionSourceAndPaymentType
} from '../../services/transactions/transactions.service.js'
import { retrieveStagedTransaction } from '../../services/transactions/retrieve-transaction.js'
import {
  createTransactionSchema,
  createTransactionResponseSchema,
  createTransactionBatchSchema,
  createTransactionBatchResponseSchema,
  finaliseTransactionRequestSchema,
  finaliseTransactionResponseSchema,
  retrieveStagedTransactionParamsSchema,
  BATCH_CREATE_MAX_COUNT
} from '../../schema/transaction.schema.js'
import db from 'debug'
const debug = db('sales:routes')

const stagingIdSchema = Joi.object({
  id: Joi.string().trim().guid().min(1).required().description('the staging identifier')
}).label('finalise-transaction-request-parameters')

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
    method: 'POST',
    path: '/transactions/$batch',
    options: {
      handler: async (request, h) => {
        debug('Received request to create %d transactions', request.payload.length)
        const responsesByIndex = {}
        const validPayloadsByIndex = {}
        for (let i = 0; i < request.payload.length; i++) {
          try {
            validPayloadsByIndex[i] = await createTransactionSchema.validateAsync(request.payload[i])
          } catch (e) {
            responsesByIndex[i] = Boom.badData(e).output.payload
          }
        }
        const validEntries = Object.entries(validPayloadsByIndex)
        debug('Checked %d transaction payloads and found %d were valid', request.payload.length, validEntries.length)
        if (validEntries.length) {
          const createTransactionResults = await createTransactions(validEntries.map(([, v]) => v))
          createTransactionResults.forEach((response, i) => {
            responsesByIndex[validEntries[i][0]] = { statusCode: 201, response }
          })
        }
        const responses = request.payload.map((p, i) => responsesByIndex[i])
        return h.response(responses).code(200)
      },
      description: 'Create a batch of new transactions',
      notes: `
      Creates new transactions in batch mode.  Can accept up to ${BATCH_CREATE_MAX_COUNT} instructions at one time.
      The payload should be an array of transactions, each entry in the array should conform to the standard endpoint to POST a single transaction.
      The response shall also be an array where each entry shall correspond by index to the request payload.  Each entry shall either contain a
      response object with a payload as per the POST to a create a single transaction or be an error structure.
      `,
      tags: ['api', 'transactions'],
      validate: {
        payload: createTransactionBatchSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Batch accepted', schema: createTransactionBatchResponseSchema },
            422: { description: 'The batch structure was invalid' }
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
        payload: finaliseTransactionRequestSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Transaction accepted', schema: finaliseTransactionResponseSchema },
            400: { description: 'Invalid request params' },
            404: { description: 'A transaction for the specified identifier was not found' },
            402: { description: 'The payment amount did not match the cost of the transaction' },
            409: { description: 'The transaction does not support recurring payments but an instruction was supplied' },
            410: {
              description:
                'The transaction has already been finalised.  The previously finalised transaction data will be returned under the data key.'
            },
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
  },
  {
    method: 'GET',
    path: '/retrieveStagedTransaction/{id}',
    options: {
      handler: async (request, h) => {
        const { id } = request.params
        const result = await retrieveStagedTransaction(id)
        return h.response(result)
      },
      description: 'Retrieve a staged transaction',
      tags: ['api', 'transactions'],
      validate: {
        params: retrieveStagedTransactionParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Staged transaction retreived' }
          },
          order: 5
        }
      }
    }
  },
  {
    method: 'PATCH',
    path: '/transactions/{id}/type',
    options: {
      handler: async (request, h) => {
        const { id } = request.params
        const { type } = request.payload
        const updatedTransaction = await updateTransactionSourceAndPaymentType(id, type)
        return h.response(updatedTransaction)
      },
      description: 'Update transaction source and payment type',
      notes: 'Update transaction source and payment type',
      tags: ['api', 'transactions'],
      validate: {
        params: Joi.object({
          id: Joi.string().required()
        }),
        payload: Joi.object({
          type: Joi.string().valid('Debit card', 'Credit card').required()
        })
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Transaction updated', schema: createTransactionResponseSchema },
            400: { description: 'Invalid request params' },
            404: { description: 'Transaction not found' }
          },
          order: 6
        }
      }
    }
  }
]

import {
  createPaymentJournalRequestSchema,
  paymentJournalEntryParamsSchema,
  paymentJournalQueryParams,
  paymentJournalQueryResponse,
  paymentJournalResponseSchema,
  updatePaymentJournalRequestSchema
} from '../../schema/payment-journal.schema.js'
import {
  createPaymentJournal,
  getPaymentJournal,
  queryJournalsByTimestamp,
  updatePaymentJournal
} from '../../services/paymentjournals/payment-journals.service.js'
import Boom from '@hapi/boom'

const PAYMENT_ENTITY_PATH = '/paymentJournals/{id}'
const SWAGGER_TAGS = ['api', 'payment-journals']
const ERROR_MESSAGES = {
  conflict: 'A payment journal with the given identifier already exists',
  notFound: '',
  unprocessableEntity: 'The request payload was invalid'
}

export default [
  {
    method: 'GET',
    path: '/paymentJournals',
    options: {
      handler: async (request, h) => h.response(await queryJournalsByTimestamp(request.query)).code(200),
      description: 'Query for all payment journal entries with the specified status and between the given start date and end date',
      notes: `
        Query for all payment journal entries with the specified status and between the given start date and end date
        Both start and end date filters are inclusive
      `,
      tags: SWAGGER_TAGS,
      validate: {
        query: paymentJournalQueryParams
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: paymentJournalQueryResponse },
            400: { description: 'Invalid query parameters' }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'PUT',
    path: PAYMENT_ENTITY_PATH,
    options: {
      handler: async (request, h) => {
        try {
          return h.response(await createPaymentJournal(request.params.id, request.payload)).code(201)
        } catch (e) {
          if (e.code === 'ConditionalCheckFailedException') {
            throw Boom.conflict(ERROR_MESSAGES.conflict)
          }
          throw e
        }
      },
      description: 'Create a new payment journal',
      notes: `
        Create a new payment journal
      `,
      tags: SWAGGER_TAGS,
      validate: {
        params: paymentJournalEntryParamsSchema,
        payload: createPaymentJournalRequestSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            201: { description: 'Payment journal created', schema: paymentJournalResponseSchema },
            409: { description: ERROR_MESSAGES.conflict },
            422: { description: ERROR_MESSAGES.unprocessableEntity }
          },
          order: 2
        }
      }
    }
  },
  {
    method: 'GET',
    path: PAYMENT_ENTITY_PATH,
    options: {
      handler: async (request, h) => {
        const record = await getPaymentJournal(request.params.id)
        if (!record) {
          throw Boom.notFound(ERROR_MESSAGES.notFound)
        }
        return h.response(record).code(200)
      },
      description: 'Retrieve an existing payment journal',
      notes: `
        Retrieve an existing payment journal
      `,
      tags: SWAGGER_TAGS,
      validate: {
        params: paymentJournalEntryParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: paymentJournalResponseSchema },
            404: { description: ERROR_MESSAGES.notFound }
          },
          order: 3
        }
      }
    }
  },
  {
    method: 'PATCH',
    path: PAYMENT_ENTITY_PATH,
    options: {
      handler: async (request, h) => {
        try {
          return h.response(await updatePaymentJournal(request.params.id, request.payload)).code(200)
        } catch (e) {
          if (e.code === 'ConditionalCheckFailedException') {
            throw Boom.notFound(ERROR_MESSAGES.notFound)
          }
          throw e
        }
      },
      description: 'Update an existing payment journal',
      notes: `
        Update an existing payment journal
      `,
      tags: SWAGGER_TAGS,
      validate: {
        params: paymentJournalEntryParamsSchema,
        payload: updatePaymentJournalRequestSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Payment journal updated', schema: paymentJournalResponseSchema },
            404: { description: ERROR_MESSAGES.notFound },
            422: { description: ERROR_MESSAGES.unprocessableEntity }
          },
          order: 4
        }
      }
    }
  }
]

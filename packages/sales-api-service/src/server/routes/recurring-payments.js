import Boom from '@hapi/boom'
import {
  dueRecurringPaymentsRequestParamsSchema,
  dueRecurringPaymentsResponseSchema,
  processRPResultRequestParamsSchema,
  cancelRecurringPaymentRequestParamsSchema,
  cancelRecurringPaymentRequestQuerySchema
} from '../../schema/recurring-payments.schema.js'
import { permissionRenewalDataRequestParamsSchema } from '../../schema/renewals.schema.js'
import { authenticateRenewalResponseSchema } from '../../schema/authenticate.schema.js'
import { permissionForFullReferenceNumber, executeQuery } from '@defra-fish/dynamics-lib'
import {
  getRecurringPayments,
  processRPResult,
  cancelRecurringPayment,
  preparePermissionDataForRcpCancellation
} from '../../services/recurring-payments.service.js'
import db from 'debug'

const SWAGGER_TAGS = ['api', 'recurring-payments']
const debug = db('sales:permission-rcp-cancellation-data')

const executeWithErrorLog = async query => {
  try {
    return await executeQuery(query)
  } catch (e) {
    debug(`Error executing query with filter ${query.filter}`)
    throw e
  }
}

const getConcessions = async permission => {
  if (permission.expanded.concessionProofs.length) {
    return permission.expanded.concessionProofs.map(cp => ({
      ...cp.expanded.concession.entity.toJSON(),
      proof: {
        ...(cp.entity.referenceNumber ? { referenceNumber: cp.entity.referenceNumber } : {}),
        type: cp.entity.type.label
      }
    }))
  }
  return []
}

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
        const { reason } = request.query
        const result = await cancelRecurringPayment(id, reason)
        return h.response(result)
      },
      description: 'Cancel a recurring payment',
      tags: SWAGGER_TAGS,
      validate: {
        params: cancelRecurringPaymentRequestParamsSchema,
        query: cancelRecurringPaymentRequestQuerySchema
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
    path: '/permissionRcpCancellationData/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const results = await executeWithErrorLog(permissionForFullReferenceNumber(request.params.referenceNumber))

        if (results.length === 1) {
          const [permission] = results
          const preparedPermission = await preparePermissionDataForRcpCancellation({
            ...permission.entity.toJSON(),
            licensee: permission.expanded.licensee.entity.toJSON(),
            concessions: await getConcessions(permission),
            permit: permission.expanded.permit.entity.toJSON()
          })
          return h.response({ permission: preparedPermission })
        } else if (results.length === 0) {
          throw Boom.unauthorized('Permission not found for recurring payment cancellation')
        } else {
          throw new Error('Unable to get permission data for recurring payment cancellation, non-unique results for query')
        }
      },
      description: 'Prepare data for recurring payment cancellation based on the existing permission data',
      notes: `
        Prepare data for recurring payment cancellation based on the existing permission data
      `,
      tags: SWAGGER_TAGS,
      validate: {
        params: permissionRenewalDataRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'Recurring payment cancellation data was prepared for the permission',
              schema: authenticateRenewalResponseSchema
            },
            401: { description: 'Recurring payment cancellation data could not be prepared for the permission' }
          },
          order: 4
        }
      }
    }
  }
]

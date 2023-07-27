import {
  createStagingExceptionRequestSchema,
  createStagingExceptionResponseSchema,
  poclValidationErrorListSchema,
  poclValidationErrorParamsSchema,
  updatePoclValidationErrorPayload
} from '../../schema/staging-exception.schema.js'
import { createTransactionFileException, createStagingException } from '../../services/exceptions/exceptions.service.js'
import {
  createPoclValidationError,
  getPoclValidationErrors,
  updatePoclValidationError
} from '../../services/exceptions/pocl-validation-errors.service.js'

const SWAGGER_TAGS = ['api', 'staging-exceptions']

const isDataValidationError = payload => {
  const { statusCode } = JSON.parse(payload.transactionFileException.description)
  return !!payload.record && statusCode === 422
}

export default [
  {
    method: 'POST',
    path: '/stagingExceptions',
    options: {
      handler: async (request, h) => {
        const { stagingException, transactionFileException } = request.payload
        const response = {}
        if (stagingException) {
          response.stagingException = await createStagingException(stagingException)
        }
        if (transactionFileException) {
          response.transactionFileException = await createTransactionFileException(transactionFileException)
          if (isDataValidationError(request.payload)) {
            await createPoclValidationError(request.payload.record, transactionFileException.transactionFile)
          }
        }
        return h.response(response).code(200)
      },
      description: 'Add a new staging exception',
      notes: `
        Add a new staging exception
      `,
      tags: SWAGGER_TAGS,
      validate: {
        payload: createStagingExceptionRequestSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: createStagingExceptionResponseSchema },
            422: { description: 'The request payload was invalid' }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/poclValidationErrors',
    options: {
      handler: async (request, h) => h.response(await getPoclValidationErrors()).code(200),
      description: 'Get all active data validation errors for processing',
      notes: `
        Query for all active POCL data validation errors which have a "Ready for Processing" status
      `,
      tags: ['api', 'pocl-validation-errors'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: poclValidationErrorListSchema }
          }
        }
      }
    }
  },
  {
    method: 'PATCH',
    path: '/poclValidationErrors/{id}',
    options: {
      handler: async (request, h) => h.response(await updatePoclValidationError(request.params.id, request.payload)).code(200),
      description: 'Get all active data validation errors for processing',
      notes: `
        Query for all active POCL data validation errors which have a "Ready for Processing" status
      `,
      tags: ['api', 'pocl-validation-errors'],
      validate: {
        params: poclValidationErrorParamsSchema,
        payload: updatePoclValidationErrorPayload
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: poclValidationErrorListSchema },
            400: { description: 'Invalid request params' },
            404: { description: 'A POCL validation error with the given identifier could not be found' },
            422: { description: 'Invalid payload' }
          }
        }
      }
    }
  }
]

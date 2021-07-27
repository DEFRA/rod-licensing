import { createStagingExceptionRequestSchema, createStagingExceptionResponseSchema, poclValidationErrorListSchema } from '../../schema/staging-exception.schema.js'
import { createTransactionFileException, createStagingException, createDataValidationError } from '../../services/exceptions/exceptions.service.js'
import { getPoclValidationErrors } from '../../services/exceptions/pocl-data-validation-errors.service.js'

const SWAGGER_TAGS = ['api', 'staging-exceptions']

const isDataValidationError = payload =>
  !!payload.record && payload.statusCode === 422

export default [
  {
    method: 'POST',
    path: '/stagingExceptions',
    options: {
      handler: async (request, h) => {
        const response = {}
        if (request.payload.stagingException) {
          response.stagingException = await createStagingException(request.payload.stagingException)
        }
        if (request.payload.transactionFileException) {
          response.transactionFileException = await createTransactionFileException(request.payload.transactionFileException)
          if (isDataValidationError(request.payload)) {
            await createDataValidationError(request.payload.record)
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
    path: '/dataValidationErrors',
    options: {
      handler: async (request, h) => {
        console.log('Inside Sales API endpoint')
        return h.response(await getPoclValidationErrors()).code(200)
      },
      description: 'Get all active data validation errors for processing',
      notes: `
        Query for all active POCL data validation errors which have a "Ready for Processing" status
      `,
      tags: ['api', 'pocl-data-validation'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'OK', schema: poclValidationErrorListSchema }
          }
        }
      }
    }
  }
]

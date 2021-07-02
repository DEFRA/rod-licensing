import { createStagingExceptionRequestSchema, createStagingExceptionResponseSchema } from '../../schema/staging-exception.schema.js'
import { createTransactionFileException, createStagingException, createDataValidationError } from '../../services/exceptions/exceptions.service.js'

const SWAGGER_TAGS = ['api', 'staging-exceptions']

const isDataValidationError = exceptionData => {
  const { statusCode } = JSON.parse(exceptionData.description)
  return statusCode === 422
}

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
          console.log('------FINISHED CREATING TRANSACTION FILE EXCEPTION-------')
          if (isDataValidationError(request.payload.transactionFileException)) {
            console.log('------IS DATA VALIDATION ERROR-------')
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
  }
]

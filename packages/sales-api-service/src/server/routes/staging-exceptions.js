import { createStagingExceptionRequestSchema, createStagingExceptionResponseSchema } from '../../schema/staging-exception.schema.js'
import { createTransactionFileException, createStagingException } from '../../services/exceptions/exceptions.service.js'

const SWAGGER_TAGS = ['api', 'staging-exceptions']

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

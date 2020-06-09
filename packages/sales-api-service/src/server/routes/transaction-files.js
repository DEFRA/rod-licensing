import Boom from '@hapi/boom'
import { persist, findByAlternateKey, PoclFile } from '@defra-fish/dynamics-lib'
import {
  createTransactionFileResponseSchema,
  createTransactionFileSchema,
  transactionFileParamsSchema
} from '../../schema/transaction-file.schema.js'
import { getGlobalOptionSetValue } from '../../services/reference-data.service.js'

export default [
  {
    method: 'GET',
    path: '/transaction-files/{fileName}',
    options: {
      handler: async (request, h) => {
        const file = await findByAlternateKey(PoclFile, request.params.fileName)
        if (!file) {
          throw Boom.notFound('An transaction file with the given identifier could not be found')
        }
        return h.response(file).code(200)
      },
      description: 'Retrieve the transaction file with the given identifier',
      notes: `
        Retrieve the transaction file with the given identifier
      `,
      tags: ['api', 'transaction-files'],
      validate: {
        params: transactionFileParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Success' },
            400: { description: 'Invalid request params' },
            404: { description: 'An transaction file with the given identifier could not be found' }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'PUT',
    path: '/transaction-files/{fileName}',
    options: {
      handler: async (request, h) => {
        let file = await findByAlternateKey(PoclFile, request.params.fileName)
        if (!file) {
          file = new PoclFile()
        }

        const payload = request.payload
        payload.dataSource = await getGlobalOptionSetValue(PoclFile.definition.mappings.dataSource.ref, payload.dataSource)
        payload.status = await getGlobalOptionSetValue(PoclFile.definition.mappings.status.ref, payload.status)

        const transactionFile = Object.assign(file, payload, { fileName: request.params.fileName })
        await persist(transactionFile)
        return h.response(transactionFile).code(200)
      },
      description: 'Create or update an transaction file header with the given identifier',
      notes: `
        Create or update an transaction file header with the given identifier
      `,
      tags: ['api', 'transaction-files'],
      validate: {
        params: transactionFileParamsSchema,
        payload: createTransactionFileSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Success', schema: createTransactionFileResponseSchema },
            400: { description: 'Invalid request params' },
            409: { description: 'An transaction file with the given identifier already exists' },
            422: { description: 'Invalid payload' }
          },
          order: 2
        }
      }
    }
  }
]

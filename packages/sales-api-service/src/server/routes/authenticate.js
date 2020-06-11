import Boom from '@hapi/boom'
import {
  authenticateRenewalRequestParamsSchema,
  authenticateRenewalRequestQuerySchema,
  authenticateRenewalResponseSchema
} from '../../schema/authenticate.schema.js'
import { permissionForLicensee, executeQuery } from '@defra-fish/dynamics-lib'

export default [
  {
    method: 'GET',
    path: '/authenticate/renewal/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const { licenseeBirthDate, licenseePostcode } = request.query
        const results = await executeQuery(permissionForLicensee(request.params.referenceNumber, licenseeBirthDate, licenseePostcode))
        if (results.length === 1) {
          return h
            .response({
              permission: {
                ...results[0].entity.toJSON(),
                licensee: results[0].expanded.licensee.entity.toJSON(),
                concessions: results[0].expanded.concessionProofs.map(c => c.entity.toJSON()),
                permit: results[0].expanded.permit.entity.toJSON()
              }
            })
            .code(200)
        } else if (results.length === 0) {
          throw Boom.unauthorized('The licensee could not be authenticated')
        } else {
          throw new Error('Unable to authenticate, non-unique results for query')
        }
      },
      description: 'Authenticate a licensee by checking the licence number corresponds with the provided contact details',
      notes: `
        Authenticate a licensee by checking the licence number corresponds with the provided contact details
      `,
      tags: ['api', 'authenticate'],
      validate: {
        params: authenticateRenewalRequestParamsSchema,
        query: authenticateRenewalRequestQuerySchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'The licensee was successfully authenticated', schema: authenticateRenewalResponseSchema },
            401: { description: 'The licensee could not be authenticated' }
          },
          order: 1
        }
      }
    }
  }
]

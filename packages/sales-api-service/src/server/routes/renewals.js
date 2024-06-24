import Boom from '@hapi/boom'
import { preparePermissionDataForRenewal } from '../../services/renewals/renewals.service.js'
import { permissionRenewalDataRequestParamsSchema, permissionRenewalDataResponseSchema } from '../../schema/renewals.schema.js'
import db from 'debug'
import { permissionForFullReferenceNumber, executeQuery } from '@defra-fish/dynamics-lib'
const debug = db('sales:permission-renewal-data')

const executeWithErrorLog = async query => {
  try {
    return await executeQuery(query)
  } catch (e) {
    debug(`Error executing query with filter ${query.filter}`)
    throw e
  }
}

export default [
  {
    method: 'GET',
    path: '/permissionRenewalData/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const results = await executeWithErrorLog(permissionForFullReferenceNumber(request.params.referenceNumber))

        if (results.length === 1) {
          const permissionData = preparePermissionDataForRenewal({
            ...results[0].entity.toJSON(),
            licensee: results[0].expanded.licensee.entity.toJSON(),
            concessions: results[0].expanded.concessions.entity.toJSON(),
            permit: results[0].expanded.permit.entity.toJSON()
          })
          return h.response(permissionData)
        } else if (results.length === 0) {
          throw Boom.unauthorized('Permission not found for renewal')
        } else {
          throw new Error('Unable to get permission data for renewal, non-unique results for query')
        }
      },
      description: 'Prepare data for renewing a permission based on the existing data',
      notes: `
        Prepare data for renewing a permission based on the existing data
      `,
      tags: ['api', 'renewals'],
      validate: {
        params: permissionRenewalDataRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Renewal data was prepared for the permission', schema: permissionRenewalDataResponseSchema },
            401: { description: 'Renewal data could not be prepared for the permission' }
          },
          order: 1
        }
      }
    }
  }
]

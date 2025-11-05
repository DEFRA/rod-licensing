import Boom from '@hapi/boom'
import {
  authenticateRenewalRequestParamsSchema,
  authenticateRenewalRequestQuerySchema,
  authenticateRenewalResponseSchema,
  rcpAuthenticateRenewalResponseSchema
} from '../../schema/authenticate.schema.js'
import db from 'debug'
import { permissionForContacts, concessionsByIds, executeQuery, contactForLicenseeNoReference } from '@defra-fish/dynamics-lib'
import { findLinkedRecurringPayment } from '../../services/recurring-payments.service.js'

const debug = db('sales:renewal-authentication')
const failAuthenticate = 'The licensee could not be authenticated'
const HTTP_OK = 200

const executeWithErrorLog = async query => {
  try {
    return await executeQuery(query)
  } catch (e) {
    debug(`Error executing query with filter ${query.filter}`)
    throw e
  }
}

const getAuthenticatedPermission = async request => {
  const { licenseeBirthDate, licenseePostcode } = request.query
  const contacts = await executeWithErrorLog(contactForLicenseeNoReference(licenseeBirthDate, licenseePostcode))

  if (!contacts.length) {
    throw Boom.unauthorized(failAuthenticate)
  }

  const contactIds = contacts.map(contact => contact.entity.id)
  const permissions = await executeWithErrorLog(permissionForContacts(contactIds))
  const results = permissions.filter(p => p.entity.referenceNumber.endsWith(request.params.referenceNumber))

  if (results.length === 0) {
    throw Boom.unauthorized(failAuthenticate)
  }

  if (results.length > 1) {
    throw new Error('Unable to authenticate, non-unique results for query')
  }

  const [matched] = results
  const concessionProofEntities = matched.expanded.concessionProofs

  const concessionProofs =
    concessionProofEntities.length > 0 ? await executeWithErrorLog(concessionsByIds(concessionProofEntities.map(f => f.entity.id))) : []

  return {
    permission: {
      ...matched.entity.toJSON(),
      licensee: matched.expanded.licensee.entity.toJSON(),
      concessions: concessionProofs.map(c => ({
        id: c.expanded.concession.entity.id,
        proof: c.entity.toJSON()
      })),
      permit: matched.expanded.permit.entity.toJSON()
    },
    permissionId: matched.entity.id
  }
}

export default [
  {
    method: 'GET',
    path: '/authenticate/renewal/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const { permission } = await getAuthenticatedPermission(request)
        return h.response({ permission }).code(HTTP_OK)
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
            401: { description: failAuthenticate }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/authenticate/rcp/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const { permission, permissionId } = await getAuthenticatedPermission(request)
        const recurringPayment = await findLinkedRecurringPayment(permissionId)
        return h.response({ permission, recurringPayment }).code(HTTP_OK)
      },
      description:
        'Authenticate a licensee by checking the licence number corresponds with the provided contact details. Checking agreement id exists and recurring payment is active and not cancelled',
      notes: `
        Authenticate a licensee by checking the licence number corresponds with the provided contact details. Checking agreement id exists and recurring payment is active and not cancelled
      `,
      tags: ['api', 'authenticate'],
      validate: {
        params: authenticateRenewalRequestParamsSchema,
        query: authenticateRenewalRequestQuerySchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: {
              description: 'The licensee was successfully authenticated',
              schema: rcpAuthenticateRenewalResponseSchema
            },
            401: { description: failAuthenticate }
          },
          order: 2
        }
      }
    }
  }
]

export const errorLogTest = { executeWithErrorLog }

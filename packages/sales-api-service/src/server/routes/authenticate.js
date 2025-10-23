import Boom from '@hapi/boom'
import {
  authenticateRenewalRequestParamsSchema,
  authenticateRenewalRequestQuerySchema,
  authenticateRenewalResponseSchema,
  rcpAuthenticateRenewalResponseSchema
} from '../../schema/authenticate.schema.js'
import db from 'debug'
import {
  permissionForContacts,
  concessionsByIds,
  executeQuery,
  contactForLicenseeNoReference
} from '@defra-fish/dynamics-lib'
import { findLinkedRecurringPayment } from '../../services/recurring-payments.service.js'
const debug = db('sales:renewal-authentication')
const failAuthenticate = 'The licensee could not be authenticated'

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
    path: '/authenticate/renewal/{referenceNumber}',
    options: {
      handler: async (request, h) => {
        const { licenseeBirthDate, licenseePostcode } = request.query
        const contacts = await executeWithErrorLog(contactForLicenseeNoReference(licenseeBirthDate, licenseePostcode))
        if (contacts.length > 0) {
          const contactIds = contacts.map(contact => contact.entity.id)
          const permissions = await executeWithErrorLog(permissionForContacts(contactIds))
          const results = permissions.filter(p => p.entity.referenceNumber.endsWith(request.params.referenceNumber))
          if (results.length === 1) {
            let concessionProofs = []
            if (results[0].expanded.concessionProofs.length > 0) {
              const ids = results[0].expanded.concessionProofs.map(f => f.entity.id)
              concessionProofs = await executeWithErrorLog(concessionsByIds(ids))
            }
            return h
              .response({
                permission: {
                  ...results[0].entity.toJSON(),
                  licensee: results[0].expanded.licensee.entity.toJSON(),
                  concessions: concessionProofs.map(c => ({
                    id: c.expanded.concession.entity.id,
                    proof: c.entity.toJSON()
                  })),
                  permit: results[0].expanded.permit.entity.toJSON()
                }
              })
              .code(200)
          } else if (results.length === 0) {
            throw Boom.unauthorized(failAuthenticate)
          } else {
            throw new Error('Unable to authenticate, non-unique results for query')
          }
        } else {
          throw Boom.unauthorized(failAuthenticate)
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
        const { licenseeBirthDate, licenseePostcode } = request.query
        const contacts = await executeWithErrorLog(contactForLicenseeNoReference(licenseeBirthDate, licenseePostcode))

        if (contacts.length > 0) {
          const contactIds = contacts.map(contact => contact.entity.id)
          const permissions = await executeWithErrorLog(permissionForContacts(contactIds))
          const results = permissions.filter(p => p.entity.referenceNumber.endsWith(request.params.referenceNumber))

          if (results.length === 1) {
            let concessionProofs = []

            if (results[0].expanded.concessionProofs.length > 0) {
              const ids = results[0].expanded.concessionProofs.map(f => f.entity.id)
              concessionProofs = await executeWithErrorLog(concessionsByIds(ids))
            }

            const recurringPayment = await findLinkedRecurringPayment(results[0].entity.id)

            return h
              .response({
                permission: {
                  ...results[0].entity.toJSON(),
                  licensee: results[0].expanded.licensee.entity.toJSON(),
                  concessions: concessionProofs.map(c => ({
                    id: c.expanded.concession.entity.id,
                    proof: c.entity.toJSON()
                  })),
                  permit: results[0].expanded.permit.entity.toJSON()
                },
                recurringPayment
              })
              .code(200)
          } else if (results.length === 0) {
            throw Boom.unauthorized(failAuthenticate)
          } else {
            throw new Error('Unable to authenticate, non-unique results for query')
          }
        } else {
          throw Boom.unauthorized(failAuthenticate)
        }
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

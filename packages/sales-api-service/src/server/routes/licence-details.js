import Boom from '@hapi/boom'
import { licenceDetailsRequestQuerySchema, licenceDetailsResponseSchema } from '../../schema/licence-details.schema.js'
import db from 'debug'
import { permissionForContacts, contactForLicenseeByPersonalDetails, executeQuery } from '@defra-fish/dynamics-lib'

const debug = db('sales:licence-details')
const failLicenceDetails = 'Licence details could not be found for the provided contact details'
const HTTP_OK = 200

const executeWithErrorLog = async query => {
  try {
    return await executeQuery(query)
  } catch (e) {
    debug(`Error executing query with filter ${query.filter}`)
    throw e
  }
}

const getLicenceDetails = async request => {
  const { licenseeFirstName, licenseeLastName, licenseeBirthDate, licenseePostcode } = request.query
  const contacts = await executeWithErrorLog(
    contactForLicenseeByPersonalDetails(licenseeFirstName, licenseeLastName, licenseeBirthDate, licenseePostcode)
  )

  if (!contacts.length) {
    throw Boom.notFound(failLicenceDetails)
  }

  const contactIds = contacts.map(contact => contact.entity.id)
  const permissions = await executeWithErrorLog(permissionForContacts(contactIds))

  if (!permissions.length) {
    throw Boom.notFound(failLicenceDetails)
  }

  return {
    licences: permissions.map(permission => ({
      ...permission.entity.toJSON(),
      licensee: permission.expanded.licensee.entity.toJSON(),
      concessions: permission.expanded.concessionProofs.map(concessionProof => concessionProof.entity.toJSON()),
      permit: permission.expanded.permit.entity.toJSON()
    }))
  }
}

export default [
  {
    method: 'GET',
    path: '/licenceDetails',
    options: {
      handler: async (request, h) => {
        const licenceDetails = await getLicenceDetails(request)
        return h.response(licenceDetails).code(HTTP_OK)
      },
      description: 'Look up licence details for a licensee using their name, postcode and date of birth',
      notes: `
        Look up licence details for a licensee using their name, postcode and date of birth
      `,
      tags: ['api', 'licence-details'],
      validate: {
        query: licenceDetailsRequestQuerySchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Licence details were found for the given contact details', schema: licenceDetailsResponseSchema },
            404: { description: failLicenceDetails }
          },
          order: 1
        }
      }
    }
  }
]

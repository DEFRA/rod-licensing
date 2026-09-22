import Boom from '@hapi/boom'
import { licenceDetailsRequestQuerySchema, licenceDetailsResponseSchema } from '../../schema/licence-details.schema.js'
import db from 'debug'
import { permissionForContacts, contactForLicenseeByPersonalDetails, executeQuery } from '@defra-fish/dynamics-lib'

const debug = db('sales:licence-details')
const failLicenceDetails = 'Licence details could not be found for the provided contact details'
const HTTP_OK = 200
const TWELVE_MONTH_DURATION_MAGNITUDE = 12
const TWELVE_MONTH_DURATION_DESIGNATOR = 'M'

const executeWithErrorLog = async query => {
  try {
    return await executeQuery(query)
  } catch (e) {
    debug(`Error executing query with filter ${query.filter}`)
    throw e
  }
}

const isActiveTwelveMonthLicence = permission => {
  const { durationMagnitude, durationDesignator } = permission.expanded.permit.entity
  const isTwelveMonthPermit =
    durationMagnitude === TWELVE_MONTH_DURATION_MAGNITUDE && durationDesignator.description === TWELVE_MONTH_DURATION_DESIGNATOR
  const hasNotExpired = new Date(permission.entity.endDate) >= new Date()
  return isTwelveMonthPermit && hasNotExpired
}

const getLicenceDetails = async request => {
  const { licenseeFirstName, licenseeLastName, licenseeBirthDate, licenseePostcode } = request.query
  const contacts = await executeWithErrorLog(
    contactForLicenseeByPersonalDetails({ licenseeFirstName, licenseeLastName, licenseeBirthDate, licenseePostcode })
  )

  if (!contacts.length) {
    throw Boom.notFound(failLicenceDetails)
  }

  const contactIds = contacts.map(contact => contact.entity.id)
  const permissions = await executeWithErrorLog(permissionForContacts(contactIds))
  const activeLicences = permissions.filter(isActiveTwelveMonthLicence)

  if (!activeLicences.length) {
    throw Boom.notFound(failLicenceDetails)
  }

  return {
    licences: activeLicences.map(permission => ({
      ...permission.entity.toJSON(),
      licensee: permission.expanded.licensee.entity.toJSON(),
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

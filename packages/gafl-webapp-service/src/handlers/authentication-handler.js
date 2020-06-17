import { IDENTIFY, CONTROLLER } from '../uri.js'
import { validation } from '@defra-fish/business-rules-lib'
import Joi from '@hapi/joi'
import { salesApi } from '@defra-fish/connectors-lib'

export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(IDENTIFY.page)

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createUKPostcodeValidator(Joi).validateAsync(payload.postcode)
  const { referenceNumber } = await request.cache().helpers.status.getCurrentPermission()

  // Authenticate
  const authenticationResult = await salesApi.authenticate(referenceNumber, dateOfBirth, postcode)

  if (!authenticationResult) {
    await request.cache().helpers.status.setCurrentPermission({ authentication: { authorized: false } })
    return h.redirect(IDENTIFY.uri.replace('{referenceNumber}', referenceNumber))
  } else {
    await request.cache().helpers.status.setCurrentPermission({ authentication: { authorized: true } })
    return h.redirect(CONTROLLER.uri)
  }
}

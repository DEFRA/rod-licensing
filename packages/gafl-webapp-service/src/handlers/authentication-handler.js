import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import { IDENTIFY, CONTROLLER } from '../uri.js'
import { validation } from '@defra-fish/business-rules-lib'
import Joi from '@hapi/joi'
import { salesApi } from '@defra-fish/connectors-lib'

/**
 * Handler to authenticate the user on the easy renewals journey. It will
 * (1) Redirect back to the identification page where there is an authentication failure
 * (2) Redirect to an error page where the renewal has expired
 * (3) Redirect back to an error page where a licence is already issued
 * (4) Establish the session cache and redirect into the controller where the user is authenticated
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
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
    await setUpCacheFromAuthenticationResult(request, authenticationResult)
    await setUpPayloads(request)
    await request.cache().helpers.status.setCurrentPermission({ authentication: { authorized: true } })
    return h.redirect(CONTROLLER.uri)
  }
}

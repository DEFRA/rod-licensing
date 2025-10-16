import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../src/uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import GetDataRedirect from '../handlers/get-data-redirect.js'
import Joi from 'joi'

export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const permission = await request.cache().helpers.status.getCurrentPermission()

  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const authenticationResult = await salesApi.authenticate(referenceNumber, dateOfBirth, postcode)

  // no licence found > send back to identify page with error
  if (!authenticationResult) {
    await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, {
      payload,
      error: { referenceNumber: 'not-found' }
    })
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: { authorised: false }
    })
    throw new GetDataRedirect(addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri))
  }

  await setUpCacheFromAuthenticationResult(request, authenticationResult)
  await setUpPayloads(request)
  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

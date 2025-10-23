import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../src/uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import Joi from 'joi'

export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const permission = await request.cache().helpers.status.getCurrentPermission()

  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const authenticationResult = await salesApi.authenticateRecurringPayment(referenceNumber, dateOfBirth, postcode)

  // no match
  if (!authenticationResult) {
    await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, {
      payload,
      error: { referenceNumber: 'not-found' }
    })
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: { authorised: false }
    })
    return h.redirect(addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri))
  }

  // no rcp agreement - REDIRECT TO BE UPDATED
  if (!authenticationResult.recurringPayment) {
    await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, {
      payload,
      error: { recurringPayment: 'not-set-up' }
    })
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: { authorised: false }
    })
    return h.redirect(addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri))
  } else {
    if (authenticationResult.recurringPayment.status === 1 || authenticationResult.recurringPayment.cancelledDate) {
      await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, {
        payload,
        error: { recurringPayment: 'rcp-cancelled' }
      })
      await request.cache().helpers.status.setCurrentPermission({
        referenceNumber,
        authentication: { authorised: false }
      })
      return h.redirect(addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri))
    }
  }

  await setUpCacheFromAuthenticationResult(request, authenticationResult)
  await setUpPayloads(request)
  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

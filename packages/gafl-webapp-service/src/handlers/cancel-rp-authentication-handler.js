import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../src/uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import Joi from 'joi'

// --- PURE: returns the data needed to update cache + where to redirect
const buildAuthFailure = (referenceNumber, payload, error) => ({
  page: {
    page: CANCEL_RP_IDENTIFY.page,
    data: { payload, error }
  },
  status: {
    referenceNumber,
    authentication: { authorised: false }
  },
  redirectPath: CANCEL_RP_IDENTIFY.uri
})

// --- IMPURE: applies the updates and performs the redirect
const applyAuthFailure = async (request, h, failure) => {
  await request.cache().helpers.page.setCurrentPermission(failure.page.page, failure.page.data)
  await request.cache().helpers.status.setCurrentPermission(failure.status)
  return h.redirect(addLanguageCodeToUri(request, failure.redirectPath))
}

export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const permission = await request.cache().helpers.status.getCurrentPermission()

  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const authenticationResult = await salesApi.authenticateRecurringPayment(referenceNumber, dateOfBirth, postcode)

  if (!authenticationResult) {
    return applyAuthFailure(request, h, buildAuthFailure(referenceNumber, payload, { referenceNumber: 'not-found' }))
  }

  if (!authenticationResult.recurringPayment) {
    return applyAuthFailure(request, h, buildAuthFailure(referenceNumber, payload, { recurringPayment: 'not-set-up' }))
  }

  if (authenticationResult.recurringPayment?.status === 1 || authenticationResult.recurringPayment?.cancelledDate) {
    return applyAuthFailure(request, h, buildAuthFailure(referenceNumber, payload, { recurringPayment: 'rcp-cancelled' }))
  }

  await setUpCacheFromAuthenticationResult(request, authenticationResult)
  await setUpPayloads(request)
  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

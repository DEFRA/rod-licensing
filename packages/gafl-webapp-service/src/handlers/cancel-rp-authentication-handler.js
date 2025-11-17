import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../src/uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setUpCancelRpCacheFromAuthenticationResult } from '../processors/recurring-payments-write-cache.js'
import Joi from 'joi'

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

const applyAuthFailure = async (request, h, failure) => {
  await request.cache().helpers.page.setCurrentPermission(failure.page.page, failure.page.data)
  await request.cache().helpers.status.setCurrentPermission(failure.status)
  return h.redirect(addLanguageCodeToUri(request, failure.redirectPath))
}

const cancelRpAuthenticationHandler = async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const permission = await request.cache().helpers.status.getCurrentPermission()

  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const authenticationResult = await salesApi.authenticateRecurringPayment(referenceNumber, dateOfBirth, postcode)

  const failures = error => applyAuthFailure(request, h, buildAuthFailure(referenceNumber, payload, error))

  if (!authenticationResult) return failures({ referenceNumber: 'not-found' })
  if (!authenticationResult.recurringPayment) return failures({ recurringPayment: 'not-set-up' })
  if (authenticationResult.recurringPayment.status === 1 || authenticationResult.recurringPayment.cancelledDate) {
    return failures({ recurringPayment: 'rcp-cancelled' })
  }

  await setUpCancelRpCacheFromAuthenticationResult(request, authenticationResult)

  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

export default cancelRpAuthenticationHandler

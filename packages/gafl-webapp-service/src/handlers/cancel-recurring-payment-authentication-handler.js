import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS } from '../../src/uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setupCancelRecurringPaymentCacheFromAuthResult } from '../processors/recurring-payments-write-cache.js'
import Joi from 'joi'

const applyAuthFailure = async (pageData, statusData, redirectUri, request, h) => {
  await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, pageData)
  await request.cache().helpers.status.setCurrentPermission(statusData)
  return h.redirect(addLanguageCodeToUri(request, redirectUri))
}

const cancelRecurringPaymentAuthenticationHandler = async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)
  const permission = await request.cache().helpers.status.getCurrentPermission()

  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  const dateOfBirth = await validation.contact
    .createBirthDateValidator(Joi)
    .validateAsync(`${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`)
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const authenticationResult = await salesApi.authenticateRecurringPayment(referenceNumber, dateOfBirth, postcode)

  const pageData = { payload }
  const statusData = { referenceNumber, authentication: { authorised: false } }

  if (!authenticationResult) {
    pageData.error = { referenceNumber: 'not-found' }
  } else if (!authenticationResult.recurringPayment) {
    pageData.error = { recurringPayment: 'not-set-up' }
  } else if (authenticationResult.recurringPayment.cancelledDate) {
    pageData.error = { recurringPayment: 'rcp-cancelled' }
  }
  if (pageData.error) {
    return applyAuthFailure(pageData, statusData, CANCEL_RP_IDENTIFY.page, request, h)
  }

  await setupCancelRecurringPaymentCacheFromAuthResult(request, authenticationResult)

  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

export default cancelRecurringPaymentAuthenticationHandler

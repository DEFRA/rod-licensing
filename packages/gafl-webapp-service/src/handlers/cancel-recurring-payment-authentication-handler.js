import { CANCEL_RP_IDENTIFY, CANCEL_RP_DETAILS, CANCEL_RP_AGREEMENT_NOT_FOUND } from '../../src/uri.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setupCancelRecurringPaymentCacheFromAuthResult } from '../processors/recurring-payments-write-cache.js'
import Joi from 'joi'

const applyAuthFailure = async (request, h, { pageData, redirectUri, statusData }) => {
  await request.cache().helpers.page.setCurrentPermission(CANCEL_RP_IDENTIFY.page, pageData)
  await request.cache().helpers.status.setCurrentPermission(statusData)
  return h.redirectWithLanguageCode(redirectUri)
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

  const context = {
    pageData: { payload },
    statusData: { referenceNumber, authentication: { authorised: false } },
    redirectUri: CANCEL_RP_IDENTIFY.uri
  }

  if (!authenticationResult) {
    context.pageData.error = { referenceNumber: 'not-found' }
  } else if (!authenticationResult.recurringPayment) {
    context.pageData.errorRedirect = true
    context.redirectUri = CANCEL_RP_AGREEMENT_NOT_FOUND.uri
  } else if (authenticationResult.recurringPayment.cancelledDate) {
    context.pageData.error = { recurringPayment: 'rcp-cancelled' }
  }
  if (context.pageData.error || context.pageData.errorRedirect) {
    return applyAuthFailure(request, h, context)
  }

  await setupCancelRecurringPaymentCacheFromAuthResult(request, authenticationResult)

  await request.cache().helpers.status.setCurrentPermission({
    authentication: { authorised: true }
  })

  return h.redirectWithLanguageCode(CANCEL_RP_DETAILS.uri)
}

export default cancelRecurringPaymentAuthenticationHandler

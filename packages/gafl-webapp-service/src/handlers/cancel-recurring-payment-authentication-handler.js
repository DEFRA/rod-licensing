import {
  CANCEL_RP_IDENTIFY,
  CANCEL_RP_DETAILS,
  CANCEL_RP_AGREEMENT_NOT_FOUND,
  CANCEL_RP_ALREADY_CANCELLED,
  CANCEL_RP_LICENCE_NOT_FOUND
} from '../../src/uri.js'
import { salesApi } from '@defra-fish/connectors-lib'
import { validation } from '@defra-fish/business-rules-lib'
import { setupCancelRecurringPaymentCacheFromAuthResult } from '../processors/recurring-payments-write-cache.js'
import { cacheDateFormat } from '../../src/processors/date-and-time-display.js'
import moment from 'moment-timezone'
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
    context.pageData.errorRedirect = true
    context.redirectUri = CANCEL_RP_LICENCE_NOT_FOUND.uri
  } else if (!authenticationResult.recurringPayment) {
    context.pageData.errorRedirect = true
    context.redirectUri = CANCEL_RP_AGREEMENT_NOT_FOUND.uri
  } else if (authenticationResult.recurringPayment.cancelledDate) {
    context.pageData.errorRedirect = true
    context.redirectUri = CANCEL_RP_ALREADY_CANCELLED.uri
    context.pageData.payload = {
      ...context.pageData.payload,
      endDate: moment(authenticationResult.recurringPayment.endDate).format(cacheDateFormat)
    }
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

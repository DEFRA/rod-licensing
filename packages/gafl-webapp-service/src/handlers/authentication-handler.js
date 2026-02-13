import { setUpCacheFromAuthenticationResult, setUpPayloads } from '../processors/renewals-write-cache.js'
import { IDENTIFY, RENEWAL_INACTIVE, LICENCE_NOT_FOUND, CONTROLLER } from '../uri.js'
import { RENEWAL_ERROR_REASON } from '../constants.js'
import { validation, RENEW_BEFORE_DAYS, RENEW_AFTER_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import Joi from 'joi'
import { salesApi } from '@defra-fish/connectors-lib'
import moment from 'moment-timezone'

/**
 * Handler to authenticate the user on the easy renewals journey. It will
 * (1) Redirect to an error page where there is an authentication failure
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
  const postcode = await validation.contact.createOverseasPostcodeValidator(Joi).validateAsync(payload.postcode)

  const permission = await request.cache().helpers.status.getCurrentPermission()
  const referenceNumber = payload.referenceNumber || permission.referenceNumber

  // Authenticate
  const authenticationResult = await salesApi.authenticate(referenceNumber, dateOfBirth, postcode)

  const linkInactive = async reason => {
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: {
        reason,
        authorized: false,
        endDate: authenticationResult.permission.endDate
      },
      currentPage: RENEWAL_INACTIVE.page
    })
    return h.redirectWithLanguageCode(RENEWAL_INACTIVE.uri)
  }

  if (!authenticationResult) {
    payload.referenceNumber = referenceNumber
    await request.cache().helpers.page.setCurrentPermission(IDENTIFY.page, { payload })
    await request.cache().helpers.status.setCurrentPermission({
      referenceNumber,
      authentication: { authorized: false },
      currentPage: LICENCE_NOT_FOUND.page
    })
    return h.redirectWithLanguageCode(LICENCE_NOT_FOUND.uri)
  } else {
    // Test for 12 month licence
    const daysDiff = moment(authenticationResult.permission.endDate).diff(moment().tz(SERVICE_LOCAL_TIME).startOf('day'), 'days')
    if (
      authenticationResult.permission.permit.durationDesignator.description === 'M' &&
      authenticationResult.permission.permit.durationMagnitude === 12
    ) {
      // Test for active renewal
      if (daysDiff > RENEW_BEFORE_DAYS) {
        return linkInactive(RENEWAL_ERROR_REASON.NOT_DUE)
      } else if (daysDiff < -RENEW_AFTER_DAYS) {
        return linkInactive(RENEWAL_ERROR_REASON.EXPIRED)
      } else {
        await setUpCacheFromAuthenticationResult(request, authenticationResult)
        await setUpPayloads(request)
        await request.cache().helpers.status.setCurrentPermission({ authentication: { authorized: true } })
        return h.redirectWithLanguageCode(CONTROLLER.uri)
      }
    } else {
      return linkInactive(RENEWAL_ERROR_REASON.NOT_ANNUAL)
    }
  }
}

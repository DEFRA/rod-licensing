import { LICENCE_SUMMARY, RENEWAL_START_DATE } from '../uri.js'
import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateFormats, PAGE_STATE } from '../constants.js'
import { errorShimm } from './page-handler.js'
import Joi from 'joi'
import moment from 'moment-timezone'
import JoiDate from '@hapi/joi-date'
import { ageConcessionHelper } from '../processors/concession-helper.js'
import { licenceToStart } from '../pages/licence-details/licence-to-start/update-transaction.js'
import { cacheDateFormat } from '../processors/date-and-time-display.js'

const JoiX = Joi.extend(JoiDate)
/**
 * Handler to dynamically validate the start date of a renewal licence.
 * This validation involves async interaction with the cache and so cannot be handled
 * directly with the route payload validator.
 * (1) Redirect back to the renewal start date page where there is a validation error
 * (2) Redirect into the licence summary where the start date is allowed
 * @param request
 * @param h
 * @returns {Promise<ResponseObject|*|Response>}
 */
export default async (request, h) => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(RENEWAL_START_DATE.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)

  const schema = Joi.object({
    'licence-start-date': JoiX.date()
      .format(dateFormats)
      .min(endDateMoment.clone().startOf('day'))
      .max(endDateMoment.clone().add(ADVANCED_PURCHASE_MAX_DAYS, 'days'))
      .required()
  })

  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  const result = schema.validate({ 'licence-start-date': licenceStartDate })

  if (result.error) {
    await request.cache().helpers.page.setCurrentPermission(RENEWAL_START_DATE.page, { payload, error: errorShimm(result.error) })
    await request
      .cache()
      .helpers.status.setCurrentPermission({ [RENEWAL_START_DATE.page]: PAGE_STATE.error, currentPage: RENEWAL_START_DATE.page })
    return h.redirectWithLanguageCode(RENEWAL_START_DATE.uri)
  } else {
    permission.licenceStartDate = moment({
      year: payload['licence-start-date-year'],
      month: Number.parseInt(payload['licence-start-date-month']) - 1,
      day: payload['licence-start-date-day']
    }).format(cacheDateFormat)

    if (moment(permission.licenceStartDate, cacheDateFormat).isSame(endDateMoment, 'day')) {
      // If today is the day of the renewal
      if (endDateMoment.isAfter(moment().tz(SERVICE_LOCAL_TIME))) {
        // Not yet expired - set the start time accordingly
        permission.licenceStartTime = endDateMoment.hours()
        permission.licenceToStart = licenceToStart.ANOTHER_DATE
      } else {
        // Already expired - set to 30 minutes after payment.
        permission.licenceToStart = licenceToStart.AFTER_PAYMENT
        permission.licenceStartTime = null
      }
    } else {
      // Renewing in advance - set the start time to midnight
      permission.licenceToStart = licenceToStart.ANOTHER_DATE
      permission.licenceStartTime = 0
    }

    ageConcessionHelper(permission)
    await request.cache().helpers.transaction.setCurrentPermission(permission)
    return h.redirectWithLanguageCode(LICENCE_SUMMARY.uri)
  }
}

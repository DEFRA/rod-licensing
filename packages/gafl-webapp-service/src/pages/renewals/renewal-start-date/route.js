import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateFormats, PAGE_STATE } from '../../../constants.js'
import { RENEWAL_START_DATE, LICENCE_SUMMARY } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import JoiDate from '@hapi/joi-date'
import moment from 'moment-timezone'
import { displayExpiryDate, cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { errorShimm } from '../../../handlers/page-handler.js'
import { licenceToStart } from '../../licence-details/licence-to-start/update-transaction.js'
import { ageConcessionHelper } from '../../../processors/concession-helper.js'

const JoiX = Joi.extend(JoiDate)

const validator = (payload, options) => {
  const { permission } = options.context.app.request
  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`

  return Joi.assert(
    { 'licence-start-date': licenceStartDate },
    Joi.object({
      'licence-start-date': JoiX.date()
        .format(dateFormats)
        .min(endDateMoment.clone().startOf('day'))
        .max(endDateMoment.clone().add(ADVANCED_PURCHASE_MAX_DAYS, 'days'))
        .required()
    }).options({ abortEarly: false, allowUnknown: true })
  )
}

export const getLicenceToStartAndLicenceStartTime = async (result, request) => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { payload } = await request.cache().helpers.page.getCurrentPermission(RENEWAL_START_DATE.page)
  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)

  if (result.error) {
    await request.cache().helpers.page.setCurrentPermission(RENEWAL_START_DATE.page, { payload, error: errorShimm(result.error) })
    await request
      .cache()
      .helpers.status.setCurrentPermission({ [RENEWAL_START_DATE.page]: PAGE_STATE.error, currentPage: RENEWAL_START_DATE.page })
    return addLanguageCodeToUri(request, RENEWAL_START_DATE.uri)
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
  }

  ageConcessionHelper(permission)
  await request.cache().helpers.transaction.setCurrentPermission(permission)
  return addLanguageCodeToUri(request, LICENCE_SUMMARY.uri)
}

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const expiryTimeString = displayExpiryDate(request, permission)
  const endDateMoment = moment.utc(permission.renewedEndDate, null, request.locale).tz(SERVICE_LOCAL_TIME)

  return {
    expiryTimeString,
    hasExpired: permission.renewedHasExpired,
    minStartDate: endDateMoment.format('DD MM YYYY'),
    maxStartDate: endDateMoment.clone().add(ADVANCED_PURCHASE_MAX_DAYS, 'days').format('DD MM YYYY'),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS
  }
}

export default pageRoute(
  RENEWAL_START_DATE.page,
  RENEWAL_START_DATE.uri,
  validator,
  request => getLicenceToStartAndLicenceStartTime(validator, request),
  getData
)

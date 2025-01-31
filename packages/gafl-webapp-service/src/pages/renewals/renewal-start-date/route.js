import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { RENEWAL_START_DATE, LICENCE_SUMMARY } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import moment from 'moment-timezone'
import { displayExpiryDate, cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { licenceToStart } from '../../licence-details/licence-to-start/update-transaction.js'
import { ageConcessionHelper } from '../../../processors/concession-helper.js'
import { renewalStartDateValidator } from '../../../schema/validators/validators.js'

const setLicenceStartDateAndTime = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { payload } = await request.cache().helpers.page.getCurrentPermission(RENEWAL_START_DATE.page)
  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)

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
  return addLanguageCodeToUri(request, LICENCE_SUMMARY.uri)
}

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const page = await request.cache().helpers.page.getCurrentPermission(RENEWAL_START_DATE.page)
  const mssgs = request.i18n.getCatalog()

  const expiryTimeString = displayExpiryDate(request, permission)
  const endDateMoment = moment.utc(permission.renewedEndDate, null, request.locale).tz(SERVICE_LOCAL_TIME)
  const minStartDate = endDateMoment.format('DD MM YYYY')
  const maxStartDate = endDateMoment.clone().add(ADVANCED_PURCHASE_MAX_DAYS, 'days').format('DD MM YYYY')

  const pageData = {
    expiryTimeString,
    hasExpired: permission.renewedHasExpired,
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS,
    maxStartDateMessage:
      mssgs.renewal_start_date_error_max_1 + ADVANCED_PURCHASE_MAX_DAYS + mssgs.renewal_start_date_error_max_2 + maxStartDate,
    renewalHint: mssgs.renewal_start_date_error_hint + minStartDate + mssgs.and + maxStartDate
  }

  if (page?.error) {
    const [errorKey] = Object.keys(page.error)
    const errorValue = page.error[errorKey]
    pageData.error = { errorKey, errorValue }
  }

  return pageData
}

const route = pageRoute(
  RENEWAL_START_DATE.page,
  RENEWAL_START_DATE.uri,
  renewalStartDateValidator,
  request => setLicenceStartDateAndTime(request),
  getData
)
route.find(r => r.method === 'POST').options.ext = {
  onPostAuth: {
    method: async (request, reply) => {
      const permission = await request.cache().helpers.transaction.getCurrentPermission()
      request.app.permission = permission
      return reply.continue
    }
  }
}

export default route

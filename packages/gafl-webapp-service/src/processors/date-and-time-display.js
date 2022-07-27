import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
export const dateDisplayFormat = 'D MMMM YYYY'
export const cacheDateFormat = 'YYYY-MM-DD'

export const advancePurchaseDateMoment = permission =>
  moment.tz(permission.licenceStartDate, cacheDateFormat, SERVICE_LOCAL_TIME).add(permission.licenceStartTime ?? 0, 'hours')

/**
 * Function to convert licence start and end times to standard strings for display in the service
 * @param permission
 * @param mssgs
 * @param displayTimeFirst - whether to display the time before the date, default is false
 * @returns {string}
 */
export const displayStartTime = (request, permission) => {
  const mssgs = request.i18n.getCatalog()
  const startMoment = permission.startDate ? moment.utc(permission.startDate, null, request.locale).tz(SERVICE_LOCAL_TIME) : advancePurchaseDateMoment(permission)
  const timeComponent = startMoment
    .format('h:mma')
    .replace('12:00am', mssgs.licence_start_time_am_text_0)
    .replace('12:00pm', mssgs.licence_start_time_am_text_12)
  return `${timeComponent} ${mssgs.renewal_start_date_expires_5} ${startMoment.format(dateDisplayFormat)}`
}

const endMomentStr = (request, date) => {
  const mssgs = request.i18n.getCatalog()
  const endMoment = moment.utc(date, null, request.locale).tz(SERVICE_LOCAL_TIME)
  const timeComponent = endMoment
    .format('h:mma')
    .replace('12:00am', () => {
      endMoment.subtract(1, 'days')
      return '11:59pm'
    })
    .replace('12:00pm', '12:00pm (midday)')
  return `${timeComponent} ${mssgs.renewal_start_date_expires_5} ${endMoment.format(dateDisplayFormat)}`
}

// For renewals
export const displayExpiryDate = (request, permission) => endMomentStr(request, permission.renewedEndDate)
export const displayEndTime = (request, permission) => endMomentStr(request, permission.endDate)

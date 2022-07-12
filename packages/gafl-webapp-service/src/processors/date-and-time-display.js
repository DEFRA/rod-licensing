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
export const displayStartTime = (permission, mssgs) => {
  const startMoment = permission.startDate ? moment.utc(permission.startDate).tz(SERVICE_LOCAL_TIME) : advancePurchaseDateMoment(permission)
  const timeComponent = startMoment
    .format('h:mma')
    .replace('12:00am', mssgs.licence_start_time_am_text_0)
    .replace('12:00pm', mssgs.licence_start_time_am_text_12)
  return `${timeComponent} on ${startMoment.format(dateDisplayFormat)}`
}

const endMomentStr = d => {
  const m = moment.utc(d).tz(SERVICE_LOCAL_TIME)
  const timeComponent = m
    .format('h:mma')
    .replace('12:00am', () => {
      m.subtract(1, 'days')
      return '11:59pm'
    })
    .replace('12:00pm', '12:00pm (midday)')
  return `${timeComponent} on ${m.format(dateDisplayFormat)}`
}

// For renewals
export const displayExpiryDate = permission => endMomentStr(permission.renewedEndDate)
export const displayEndTime = permission => endMomentStr(permission.endDate)

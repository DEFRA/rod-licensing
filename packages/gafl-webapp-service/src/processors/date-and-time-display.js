import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
export const dateDisplayFormat = 'dddd, MMMM Do, YYYY'
export const titleDateDisplayFormat = 'MMMM Do YYYY'
export const cacheDateFormat = 'YYYY-MM-DD'

export const advancePurchaseDateMoment = permission =>
  moment.tz(permission.licenceStartDate, cacheDateFormat, SERVICE_LOCAL_TIME).add(permission.licenceStartTime ?? 0, 'hours')

/**
 * Function to convert licence start and end times to standard strings for display in the service
 * @param permission
 * @returns {string}
 */
export const displayStartTime = (permission, displayTimeFirst) => {
  const startMoment = permission.startDate ? moment.utc(permission.startDate).tz(SERVICE_LOCAL_TIME) : advancePurchaseDateMoment(permission)
  const timeComponent = startMoment
    .format('h:mma')
    .replace('12:00am', '12:00am (midnight)')
    .replace('12:00pm', '12:00pm (midday)')
  return displayTimeFirst
    ? `${timeComponent}, ${startMoment.format(titleDateDisplayFormat)}`
    : `${startMoment.format(dateDisplayFormat)}, ${timeComponent}`
}

export const displayStartTimeTitle = permission => {
  const startMoment = permission.startDate ? moment.utc(permission.startDate).tz(SERVICE_LOCAL_TIME) : advancePurchaseDateMoment(permission)
  const timeComponent = startMoment
    .format('h:mma')
    .replace('12:00am', '12:00am (midnight)')
    .replace('12:00pm', '12:00pm (midday)')
  return `${timeComponent}, ${startMoment.format(titleDateDisplayFormat)}`
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
  return `${m.format(dateDisplayFormat)}, ${timeComponent}`
}

// For renewals
export const displayExpiryDate = permission => endMomentStr(permission.renewedEndDate)
export const displayEndTime = permission => endMomentStr(permission.endDate)

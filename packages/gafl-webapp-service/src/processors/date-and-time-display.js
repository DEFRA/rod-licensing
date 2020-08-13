import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
export const dateDisplayFormat = 'dddd, MMMM Do, YYYY'
const cacheDateFormat = 'YYYY-MM-DD'

export const advancePurchaseDateMoment = permission =>
  moment.tz(permission.licenceStartDate, cacheDateFormat, SERVICE_LOCAL_TIME).add(permission.licenceStartTime ?? 0, 'hours')

/**
 * Function to convert licence start and end times to standard strings for display in the service
 * @param permission
 * @returns {string}
 */
export const displayStartTime = permission => {
  const startMoment = permission.startDate ? moment.utc(permission.startDate).tz(SERVICE_LOCAL_TIME) : advancePurchaseDateMoment(permission)
  const timeComponent = startMoment
    .format('h:mma')
    .replace('12:00am', '12:00am (midnight)')
    .replace('12:00pm', '12:00pm (midday)')
  return `${startMoment.format(dateDisplayFormat)}, ${timeComponent}`
}

// For renewals
export const displayExpiryDate = permission => {
  const startDateString = moment(permission.renewedEndDate, cacheDateFormat)
    .add(-1, 'days')
    .format(dateDisplayFormat)
  return `${startDateString}, 11:59pm`
}

export const displayEndTime = permission => {
  let endMoment = moment.utc(permission.endDate).tz(SERVICE_LOCAL_TIME)
  const timeComponent = endMoment
    .format('h:mma')
    .replace('12:00am', () => {
      endMoment = endMoment.subtract(1, 'days')
      return '11:59pm'
    })
    .replace('12:00pm', '12:00pm (midday)')
  return `${endMoment.format(dateDisplayFormat)}, ${timeComponent}`
}

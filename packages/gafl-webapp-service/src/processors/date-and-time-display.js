import moment from 'moment'

export const dateDisplayFormat = 'dddd, MMMM Do, YYYY'
const cacheDateFormat = 'YYYY-MM-DD'
/**
 * Function to convert licence start and end times to standard strings for display in the service
 * @param permission
 * @returns {string}
 */
export const displayStartTime = permission => {
  const startMoment = permission.startDate
    ? moment(permission.startDate)
    : moment(permission.licenceStartDate, cacheDateFormat).add(permission.licenceStartTime ?? 0, 'hours')
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
  let endMoment = moment(permission.endDate)
  const timeComponent = endMoment
    .format('h:mma')
    .replace('12:00am', () => {
      endMoment = endMoment.subtract(1, 'days')
      return '11:59pm'
    })
    .replace('12:00pm', '12:00pm (midday)')
  return `${endMoment.format(dateDisplayFormat)}, ${timeComponent}`
}

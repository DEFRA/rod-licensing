import moment from 'moment'

export const dateDisplayFormat = 'dddd, MMMM Do, YYYY'
const cacheDateFormat = 'YYYY-MM-DD'
/**
 * Function to convert licence start and end times to standard strings for display in the service
 * @param permission
 * @returns {string}
 */
export const displayStartTime = permission => {
  const startDateString = moment(permission.licenceStartDate, cacheDateFormat).format(dateDisplayFormat)
  const timeComponent = (() => {
    if (!permission.licenceStartTime || permission.licenceStartTime === '0') {
      return 'Start of the day'
    } else if (permission.licenceStartTime === '12') {
      return 'Midday'
    } else {
      return moment(permission.licenceStartDate, cacheDateFormat)
        .add(permission.licenceStartTime, 'hours')
        .format('h:mma')
    }
  })()

  return `${timeComponent}, ${startDateString}`
}

// For renewals
export const displayExpiryDate = permission => {
  const startDateString = moment(permission.renewedEndDate, cacheDateFormat)
    .add(-1, 'days')
    .format(dateDisplayFormat)
  return `11:59pm, ${startDateString}`
}

export const displayEndTime = permission => {
  const endDateTime = moment(permission.endDate)
  let endDateString = endDateTime.format(dateDisplayFormat)
  const endTimeHours = endDateTime.hour()
  let result

  if (endTimeHours === 12) {
    result = `Midday ${endDateString}`
  } else if (endTimeHours === 0) {
    endDateString = endDateTime.add(-1, 'days').format(dateDisplayFormat)
    result = `11:59pm ${endDateString}`
  } else {
    result = `${endDateTime.hours(endTimeHours).format('h:mma')} ${endDateString}`
  }

  return result
}

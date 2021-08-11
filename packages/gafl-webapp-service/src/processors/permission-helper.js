import moment from 'moment'

export const logStartDateError = permission => {
  const { startDate, issueDate } = permission
  if (moment(startDate).isBefore(issueDate || undefined)) {
    console.error('permission start date before current time: ', permission)
  }
}

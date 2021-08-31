import moment from 'moment'
const POCL_DATA_SOURCE_ID = 910400000

export const logStartDateError = async (permission, request) => {
  const { startDate, issueDate } = permission
  const startDateBeforeTargetDate = moment(startDate).isBefore(issueDate || undefined)
  const isPOCLImport = permission?.dataSource?.id === POCL_DATA_SOURCE_ID
  if (startDateBeforeTargetDate && !isPOCLImport) {
    console.error(`permission start date before ${issueDate ? 'issue date' : 'current time'}: `, permission)
    console.log('page cache', JSON.stringify(await request.cache().helpers.page.get()))
    console.log('transaction cache', JSON.stringify(await request.cache().helpers.transaction.get()))
    console.log('status cache', JSON.stringify(await request.cache().helpers.status.get()))
  }
}

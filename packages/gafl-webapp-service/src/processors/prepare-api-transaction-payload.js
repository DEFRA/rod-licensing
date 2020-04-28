import moment from 'moment'

const prepareApiTransactionPayload = async request => {
  const transactionCache = await request.cache().helpers.transaction.get()
  return {
    dataSource: 'Web Sales',
    permissions: transactionCache.permissions.map(p => {
      const permission = {}
      permission.permitId = p.permit.id
      permission.licensee = p.licensee
      permission.issueDate = moment().toISOString()
      permission.startDate = moment(p.licenceStartDate, 'YYYY-MM-DD')
        .add(p.licenceStartTime, 'hours').toISOString()

      // TODO - Remove
      permission.licensee.country = 'United Kingdom'
      return permission
    })
  }
}

export default prepareApiTransactionPayload

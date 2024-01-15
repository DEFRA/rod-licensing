import { CommonResults } from '../../constants.js'
import { validForRecurringPayment } from '../../processors/recurring-pay-helper.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (validForRecurringPayment(permission)) {
    return CommonResults.RECURRING
  }

  return CommonResults.OK
}

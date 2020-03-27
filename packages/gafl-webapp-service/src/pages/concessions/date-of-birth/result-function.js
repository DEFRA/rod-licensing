import transactionHelper from '../../../lib/transaction-helper.js'
import { CONCESSION } from '../../../constants.js'

export default async request => {
  const permission = await transactionHelper.getPermission(request)

  let result

  if (permission.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!permission.concession) {
    result = 'adult'
  } else if (permission.concession === CONCESSION.SENIOR) {
    result = 'senior'
  } else if (permission.concession === CONCESSION.JUNIOR) {
    result = 'junior'
  }

  return result
}

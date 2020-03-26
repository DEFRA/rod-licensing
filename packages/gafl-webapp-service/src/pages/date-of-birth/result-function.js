import transactionHelper from '../../lib/transaction-helper.js'

export default async request => {
  const permission = await transactionHelper.getPermission(request)

  let result

  if (permission.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!permission.concession) {
    result = 'adult'
  } else if (permission.concession === 'senior') {
    result = 'senior'
  } else if (permission.concession === 'junior') {
    result = 'junior'
  }

  return result
}

import transactionHelper from '../../lib/transaction-helper.js'

export default async request => {
  const permission = await transactionHelper.getPermission(request)
  if (permission.noLicenceRequired) {
    return 'noLicenceRequired'
  }

  if (!permission.concession) {
    return 'adult'
  }

  if (permission.concession === 'senior') {
    return 'senior'
  }

  if (permission.concession === 'junior') {
    return 'junior'
  }
}

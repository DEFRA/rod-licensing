import transactionHelper from '../../../lib/cache-helper.js'

export default async request => {
  const permission = await transactionHelper.getPermission(request)
  return permission.licenceLength === '12M' ? 'andContinue' : 'andStartTime'
}

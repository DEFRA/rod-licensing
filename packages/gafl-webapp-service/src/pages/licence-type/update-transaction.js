import transactionHelper from '../../lib/transaction-helper.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['licence-type']

  const permission = {
    licenceType: payload['licence-type']
  }

  if (permission.licenceType === 'salmon-and-sea-trout') {
    permission.numberOfRods = '3'
  }

  await transactionHelper.setPermission(request, permission)
}

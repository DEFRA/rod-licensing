import transactionHelper from '../../../lib/transaction-helper.js'
import { LICENCE_TYPE } from '../../../constants.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[LICENCE_TYPE.page]

  const permission = {
    licenceType: payload['licence-type']
  }

  if (permission.licenceType === 'salmon-and-sea-trout') {
    permission.numberOfRods = '3'
  }

  await transactionHelper.setPermission(request, permission)
}

import cacheHelper from '../../../lib/cache-helper.js'
import { LICENCE_TYPE } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[LICENCE_TYPE.page]

  const permission = {
    licenceType: payload['licence-type']
  }

  if (permission.licenceType === 'salmon-and-sea-trout') {
    permission.numberOfRods = '3'
  }

  await cacheHelper.setPermission(request, permission)
}

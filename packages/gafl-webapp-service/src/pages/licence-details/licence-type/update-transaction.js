import { LICENCE_TYPE } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)

  const permission = {
    licenceType: payload['licence-type']
  }

  if (permission.licenceType === 'salmon-and-sea-trout') {
    permission.numberOfRods = '3'
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

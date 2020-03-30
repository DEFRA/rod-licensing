import { LICENCE_LENGTH } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  await request.cache().helpers.transaction.setCurrentPermission({ licenceLength: payload['licence-length'] })
}

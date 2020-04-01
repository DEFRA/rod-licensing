import { LICENCE_START_TIME } from '../../../constants.js'

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_START_TIME.page)
  await request.cache().helpers.transaction.setCurrentPermission({ licenceStartTime: payload['licence-start-time'] })
}

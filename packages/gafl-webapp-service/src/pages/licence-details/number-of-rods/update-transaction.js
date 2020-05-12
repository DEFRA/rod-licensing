import { NUMBER_OF_RODS } from '../../../uri.js'
/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(NUMBER_OF_RODS.page)
  await request.cache().helpers.transaction.setCurrentPermission({ numberOfRods: payload['number-of-rods'] })
}

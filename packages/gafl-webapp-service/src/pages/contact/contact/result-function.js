import { HOW_CONTACTED } from '../../../constants.js'
/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const { contact } = await request.cache().helpers.transaction.getCurrentPermission()
  return contact.method === HOW_CONTACTED.none ? 'no' : 'yes'
}

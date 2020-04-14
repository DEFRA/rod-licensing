import { HOW_CONTACTED } from '../../../constants.js'
/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  return licensee.preferredMethodOfConfirmation === HOW_CONTACTED.letter ? 'no' : 'yes'
}

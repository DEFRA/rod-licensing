import { HOW_CONTACTED } from '../../../constants.js'
/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  let result = 'yes'

  if (status.fromSummary) {
    result = 'summary'
  } else if ([HOW_CONTACTED.letter, HOW_CONTACTED.none].includes(licensee.preferredMethodOfConfirmation)) {
    result = 'no'
  }

  return result
}

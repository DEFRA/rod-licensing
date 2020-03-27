import camelCase from 'camelcase'
import { LICENCE_TO_START } from '../../../constants.js'
/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[LICENCE_TO_START.page]
  return camelCase(payload['licence-to-start'])
}

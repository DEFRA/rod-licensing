import camelCase from 'camelcase'
import { LICENCE_TYPE } from '../../../constants.js'
import cacheHelper from '../../../lib/cache-helper.js'
/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[LICENCE_TYPE.page]
  return camelCase(payload['licence-type'])
}

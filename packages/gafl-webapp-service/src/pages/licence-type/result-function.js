import camelCase from 'camelcase'

/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache['licence-type']
  return camelCase(payload['licence-type'])
}

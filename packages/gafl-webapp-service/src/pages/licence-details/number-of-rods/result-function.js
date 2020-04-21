/**
 * Returns rod license type troutAndCourse or salmonAndSeaTrout
 * @param request
 * @returns {Promise<string>}
 */
export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary ? 'summary' : 'ok'
}

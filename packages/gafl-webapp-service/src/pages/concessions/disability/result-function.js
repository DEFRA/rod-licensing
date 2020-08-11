export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary ? 'summary' : 'ok'
}

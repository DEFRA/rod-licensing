export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary === 'contact-summary' ? 'summary' : 'ok'
}

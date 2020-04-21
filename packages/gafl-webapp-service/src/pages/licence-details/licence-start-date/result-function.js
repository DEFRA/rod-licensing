export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()
  return permission.licenceLength === '12M' ? status.fromSummary ? 'summary' : 'andContinue' : 'andStartTime'
}

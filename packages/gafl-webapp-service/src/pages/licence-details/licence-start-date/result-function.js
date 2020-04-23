export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()
  if (permission.licenceLength === '12M') {
    return status.fromSummary ? 'summary' : 'andContinue'
  } else {
    return 'andStartTime'
  }
}

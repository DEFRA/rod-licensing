export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  return permission.licenceLength === '12M' ? 'andContinue' : 'andStartTime'
}

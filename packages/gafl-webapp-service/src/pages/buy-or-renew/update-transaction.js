import { BUY_OR_RENEW } from '../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BUY_OR_RENEW.page)
  const buyNewLicence = payload['buy-or-renew'] === 'buy-licence'
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.buyNewLicence = buyNewLicence
  await request.cache().helpers.status.setCurrentPermission(permission)
}

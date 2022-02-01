import { BUY_OR_RENEW } from '../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BUY_OR_RENEW.page)
  const buyNewLicence = payload['buy-or-renew'] === 'buy-licence'
  await request.cache().helpers.status.setCurrentPermission({ buyNewLicence })
}

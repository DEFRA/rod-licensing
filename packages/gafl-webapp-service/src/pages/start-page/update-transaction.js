import { START_PAGE } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(START_PAGE.page)
  const buyNewLicence = payload['start-page'] === 'buy-licence'
  await request.cache().helpers.status.setCurrentPermission({ buyNewLicence })
}

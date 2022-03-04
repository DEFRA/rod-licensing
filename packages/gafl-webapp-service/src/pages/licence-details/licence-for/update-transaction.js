import { LICENCE_FOR } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
  const isLicenceForYou = payload['licence-for'] === 'you'

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.isLicenceForYou = isLicenceForYou

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

import { LICENCE_FOR } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
  const isLicenceForYou = payload['licence-for'] === 'you'
  await request.cache().helpers.status.setCurrentPermission({ isLicenceForYou })
}

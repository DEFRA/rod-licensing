import { LICENCE_FOR } from '../../../uri.js'

export default async request => {
  const permission = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
  const isLicenceForYou = (permission.payload[LICENCE_FOR.page] === 'you')
  await request.cache().helpers.status.setCurrentPermission({ isLicenceForYou })

  const { currentPermissionIdx } = await request.cache().helpers.status.get()
  const pageCache = Object.assign({}, await request.cache().helpers.page.get())
  const licenceForHasChanged = (permission.payload[LICENCE_FOR.page] !== request.payload[LICENCE_FOR.page])
  if (licenceForHasChanged) {
    pageCache.permissions[currentPermissionIdx] = {
      [LICENCE_FOR.page]: permission
    }
    await request.cache().helpers.page.set(pageCache)
  }
}

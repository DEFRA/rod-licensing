import { LICENCE_FOR } from '../../../uri.js'

const setIsLicenceForYou = async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
  const isLicenceForYou = (payload[LICENCE_FOR.page] === 'you')
  await request.cache().helpers.status.setCurrentPermission({ isLicenceForYou })
}

const clearPageCacheIfLicenceForHasChanged = async request => {
  const permission = await request.cache().helpers.page.getCurrentPermission(LICENCE_FOR.page)
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

export default async request => {
  await setIsLicenceForYou(request)
  await clearPageCacheIfLicenceForHasChanged(request)
}

import { HAS_EXISTING_LICENCE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'

export const getData = async request => {
  const existingPermissions = await request.cache().helpers.transaction.getExistingPermissions()
  // const existingPermissions = ['foo']

  return {
    existingPermissionsCount: existingPermissions.length
  }
}

export default pageRoute(HAS_EXISTING_LICENCE.page, HAS_EXISTING_LICENCE.uri, null, nextPage, getData)

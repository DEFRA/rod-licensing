import { LICENCE_CONFIRMATION_METHOD } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_CONFIRMATION_METHOD.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

  if (isPhysical(permission)) {
    switch (payload['licence-confirmation-method']) {
      case 'email':
        licensee.preferredMethodOfConfirmation = HOW_CONTACTED.email
        licensee.email = payload.email
        break

      case 'text':
        licensee.preferredMethodOfConfirmation = HOW_CONTACTED.text
        licensee.mobilePhone = payload.text
        break

      default:
    }
  }
  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

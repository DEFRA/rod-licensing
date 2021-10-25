import { LICENCE_CONFIRMATION_METHOD, CONTACT } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_CONFIRMATION_METHOD.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

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
      licensee.preferredMethodOfConfirmation = HOW_CONTACTED.none
      break
  }

  await request.cache().helpers.status.setCurrentPermission({ [CONTACT.page]: false })
  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

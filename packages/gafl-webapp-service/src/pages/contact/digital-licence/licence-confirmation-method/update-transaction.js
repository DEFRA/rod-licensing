import { LICENCE_CONFIRMATION_METHOD } from '../../../../uri.js'
import { HOW_CONTACTED } from '../../../../processors/mapping-constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_CONFIRMATION_METHOD.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

  const licenceConfirmationMethod = payload['licence-confirmation-method']
  if (licenceConfirmationMethod === 'email') {
    licensee.preferredMethodOfConfirmation = HOW_CONTACTED.email
    licensee.email = payload.email
  }
  if (licenceConfirmationMethod === 'text') {
    licensee.preferredMethodOfConfirmation = HOW_CONTACTED.text
    licensee.mobilePhone = payload.text
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

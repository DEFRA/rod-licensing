import { LICENCE_FULFILMENT } from '../../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_FULFILMENT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

  const licenceOption = payload['licence-option']
  if (licenceOption === 'digital') {
    licensee.postalFulfilment = false
  }
  if (licenceOption === 'paper-licence') {
    licensee.postalFulfilment = true
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

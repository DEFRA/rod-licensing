import { CONTACT, HOW_CONTACTED } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const contact = permission.contact || {}

  switch (payload['how-contacted']) {
    case 'email':
      contact.method = HOW_CONTACTED.email
      contact.emailAddress = payload.email
      break

    case 'text':
      contact.method = HOW_CONTACTED.text
      contact.textNumber = payload.text
      break

    default:
      contact.method = HOW_CONTACTED.none
      delete contact.emailAddress
      delete contact.textNumber
  }

  Object.assign(permission, contact)
  await request.cache().helpers.transaction.setCurrentPermission({ contact })
}

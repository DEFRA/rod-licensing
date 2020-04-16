import { CONTACT, HOW_CONTACTED, CONCESSION } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

  switch (payload['how-contacted']) {
    case 'email':
      licensee.preferredMethodOfConfirmation = HOW_CONTACTED.email
      licensee.preferredMethodOfReminder = HOW_CONTACTED.email
      licensee.email = payload.email
      delete licensee.mobilePhone
      break

    case 'text':
      licensee.preferredMethodOfConfirmation = HOW_CONTACTED.text
      licensee.preferredMethodOfReminder = HOW_CONTACTED.text
      licensee.mobilePhone = payload.text
      delete licensee.email
      break

    default:
      if (permission.licenceLength === '12M' && licensee.concession.type !== CONCESSION.JUNIOR) {
        licensee.preferredMethodOfConfirmation = HOW_CONTACTED.letter
        licensee.preferredMethodOfReminder = HOW_CONTACTED.letter
      } else {
        licensee.preferredMethodOfConfirmation = HOW_CONTACTED.none
        licensee.preferredMethodOfReminder = HOW_CONTACTED.none
      }

      delete licensee.mobilePhone
      delete licensee.email
  }

  await request.cache().helpers.transaction.setCurrentPermission({ licensee })
}

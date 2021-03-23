import { CONTACT } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  permission.licensee.preferredMethodOfNewsletter = permission.licensee.preferredMethodOfNewsletter || HOW_CONTACTED.none

  permission.licensee = {
    ...permission.licensee, 
    ...isPhysical(permission) ? getPhysicalReminders(permission.licensee, payload) :
      getDigitalConfirmationsAndReminders(permission.licensee, payload)
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

const getPhysicalReminders = (licensee, payload) => {
  switch (payload['how-contacted']) {
    case 'email':
      licensee.preferredMethodOfReminder = HOW_CONTACTED.email
      licensee.email = payload.email
      return {
        email: payload.email,
        preferredMethodOfReminder: HOW_CONTACTED.email
      }
    case 'text':
      return {
        preferredMethodOfReminder: HOW_CONTACTED.text,
        mobilePhone: payload.text
      }
    default:
      return {
        preferredMethodOfReminder: HOW_CONTACTED.letter
      }
  }
}

const getDigitalConfirmationsAndReminders = (licensee, payload) => {
  switch (payload['how-contacted']) {
    case 'email':
      return {
        preferredMethodOfConfirmation: HOW_CONTACTED.email,
        preferredMethodOfReminder: HOW_CONTACTED.email,
        email: payload.email,
        mobilePhone: null
      }
    case 'text':
      return {
        preferredMethodOfConfirmation: HOW_CONTACTED.text,
        preferredMethodOfReminder: HOW_CONTACTED.text,
        mobilePhone: payload.text,
        email: licensee.preferredMethodOfNewsletter === HOW_CONTACTED.email ? licensee.email : null
      }
    default:
      return {
        preferredMethodOfConfirmation: HOW_CONTACTED.none,
        preferredMethodOfReminder: HOW_CONTACTED.none,
        mobilePhone: null,
        email: licensee.preferredMethodOfNewsletter === HOW_CONTACTED.email ? licensee.email : null
      }
  }
}
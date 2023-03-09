import { CONTACT } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { isPhysicalOld } from '../../../processors/licence-type-display.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  permission.licensee = {
    preferredMethodOfNewsletter: HOW_CONTACTED.none,
    ...permission.licensee,
    ...(isPhysicalOld(permission) ? getPhysicalReminders(payload) : getDigitalConfirmationsAndReminders(permission.licensee, payload))
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

const getPhysicalReminders = payload => {
  switch (payload['how-contacted']) {
    case 'email':
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
        postalFulfilment: false,
        preferredMethodOfConfirmation: HOW_CONTACTED.email,
        preferredMethodOfReminder: HOW_CONTACTED.email,
        email: payload.email,
        mobilePhone: null
      }
    case 'text':
      return {
        postalFulfilment: false,
        preferredMethodOfConfirmation: HOW_CONTACTED.text,
        preferredMethodOfReminder: HOW_CONTACTED.text,
        mobilePhone: payload.text,
        email: licensee.preferredMethodOfNewsletter === HOW_CONTACTED.email ? licensee.email : null
      }
    default:
      return {
        postalFulfilment: false,
        preferredMethodOfConfirmation: HOW_CONTACTED.none,
        preferredMethodOfReminder: HOW_CONTACTED.none,
        mobilePhone: null,
        email: licensee.preferredMethodOfNewsletter === HOW_CONTACTED.email ? licensee.email : null
      }
  }
}

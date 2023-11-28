import { CONTACT } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  console.log(permission)

  permission.licensee = {
    preferredMethodOfNewsletter: HOW_CONTACTED.none,
    ...permission.licensee,
    ...(isPhysical(permission) ? getPhysicalReminders(permission.licensee, payload) : getDigitalConfirmationsAndReminders(permission.licensee, payload))
  }

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

const getPhysicalReminders = (licensee, payload) => {
  console.log('HIT')
  switch (payload['how-contacted']) {
    case 'email':
      return {
        email: payload.email ? payload.email : licensee.email,
        preferredMethodOfReminder: HOW_CONTACTED.email
      }
    case 'text':
      return {
        preferredMethodOfReminder: HOW_CONTACTED.text,
        mobilePhone: payload.text ? payload.text : licensee.mobilePhone
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
        email: payload.email ? payload.email : licensee.email,
        mobilePhone: null
      }
    case 'text':
      return {
        postalFulfilment: false,
        preferredMethodOfConfirmation: HOW_CONTACTED.text,
        preferredMethodOfReminder: HOW_CONTACTED.text,
        mobilePhone: payload.text ? payload.text : licensee.mobilePhone,
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

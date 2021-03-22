import { CONTACT } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CONTACT.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const { licensee } = permission

  licensee.preferredMethodOfNewsletter = licensee.preferredMethodOfNewsletter || HOW_CONTACTED.none

  const howContacted = payload['how-contacted']
  const isPhysicalLicence = isPhysical(permission)

  licensee.preferredMethodOfReminder = getContactMethod(howContacted, isPhysicalLicence)

  // preferredMethodOfConfirmation is set on licence-confirmation-method screen for physical licences
  if (!isPhysicalLicence) {
    licensee.preferredMethodOfConfirmation = getContactMethod(howContacted, isPhysicalLicence)
  }
  licensee.email = getEmail(payload, licensee)
  licensee.mobilePhone = getText(payload, licensee)

  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

const getContactMethod = (howContacted, isPhysicalLicence) => {
  switch (howContacted) {
    case 'email':
      return HOW_CONTACTED.email
    case 'text':
      return HOW_CONTACTED.text
    default:
      return isPhysicalLicence ? HOW_CONTACTED.letter : HOW_CONTACTED.none
  }
}

const getEmail = (payload, licensee) => {
  if (hasCommunicationMethod(licensee, HOW_CONTACTED.email)) {
    return payload.email
  } if (hasNewsletterEmail(licensee)) {
    return licensee.email
  }
  return null
}

const getText = (payload, licensee) => {
  if (hasCommunicationMethod(licensee, HOW_CONTACTED.text)) {
    return payload.text
  } if (hasNewsletterEmail(licensee)) {
    return licensee.email
  }
  return null
}

const hasCommunicationMethod = (licensee, communicationMethod) => {
  if (licensee.preferredMethodOfConfirmation === communicationMethod
    || licensee.preferredMethodOfReminder === communicationMethod) {
    return true
  }
  return false
}

const hasNewsletterEmail = licensee => licensee.preferredMethodOfNewsletter === HOW_CONTACTED.email

import { CONTACT, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../uri.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { hasJunior } from '../../../processors/concession-helper.js'
import { nextPage } from '../../../routes/next-page.js'
import { mobilePhoneValidator } from '../../../processors/contact-validator.js'

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  // We need to have set the licence length, dob and start date here to determining the contact
  // messaging
  if (!permission.licensee.birthDate) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!permission.licenceLength) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  return {
    title: getTitle(permission, mssgs),
    postHint: getPostHint(permission, mssgs),
    content: getContent(permission, mssgs),
    emailText: getEmailText(permission, mssgs),
    mobileText: getMobileText(permission, mssgs),
    licensee: permission.licensee,
    isPhysical: isPhysical(permission),
    isJunior: hasJunior(permission),
    howContacted: HOW_CONTACTED
  }
}

const getTitle = (permission, messages) => permission.isLicenceForYou ? messages.important_info_contact_title_you : messages.important_info_contact_title_other

const getPostHint = (permission, messages) => permission.isLicenceForYou ? messages.important_info_contact_post_hint_you : messages.important_info_contact_post_hint_other

const getContent = (permission, messages) => {
  if (permission.licenceType === 'Salmon and sea trout') {
    return permission.isLicenceForYou ? messages.important_info_contact_post_salmon_you : messages.important_info_contact_post_salmon_other
  }
  return permission.isLicenceForYou ? messages.important_info_contact_post_not_salmon_you : messages.important_info_contact_post_not_salmon_other
}

const getMobileText = (permission, messages) => permission.licensee.mobilePhone ? `${messages.important_info_contact_item_txt_value}${permission.licensee.mobilePhone}` : messages.important_info_contact_item_txt

const getEmailText = (permission, messages) => permission.licensee.email ? `${messages.important_info_contact_item_email_value}${permission.licensee.email}` : messages.important_info_contact_item_email

export const validator = Joi.object({
  'how-contacted': Joi.string().valid('email', 'text', 'none').required(),
  email: Joi.alternatives().conditional('how-contacted', {
    is: 'email',
    then: validation.contact.createEmailValidator(Joi),
    otherwise: Joi.string().empty('')
  }),
  text: Joi.alternatives().conditional('how-contacted', {
    is: 'text',
    then: mobilePhoneValidator,
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CONTACT.page, CONTACT.uri, validator, nextPage, getData)

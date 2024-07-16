import { CONTACT, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { hasJunior } from '../../../processors/concession-helper.js'
import { nextPage } from '../../../routes/next-page.js'
import { mobilePhoneValidator } from '../../../processors/contact-validator.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'

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

  const junior = hasJunior(permission)

  return {
    title: getTitle(permission, mssgs, junior),
    postHint: getPostHint(permission, mssgs),
    content: getContent(permission, mssgs, junior),
    emailConfirmation: permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email,
    emailText: getEmailText(permission, mssgs),
    mobileConfirmation: permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text,
    mobileText: getMobileText(permission, mssgs),
    licensee: permission.licensee,
    isPhysical: isPhysical(permission),
    errorMessage: getErrorText(permission, mssgs, junior),
    twelveMonthLicence: permission.licenceLength === '12M'
  }
}

const getTitle = (permission, messages, junior) => {
  if (permission.licenceLength === '12M' && !junior) {
    return permission.isLicenceForYou ? messages.important_info_contact_title_you : messages.important_info_contact_title_other
  }
  return permission.isLicenceForYou ? messages.licence_confirm_method_where_title_you : messages.licence_confirm_method_where_title_other
}

const getPostHint = (permission, messages) =>
  permission.isLicenceForYou ? messages.important_info_contact_post_hint_you : messages.important_info_contact_post_hint_other

const getContent = (permission, messages, junior) => {
  const isSalmonLicense = permission.licenceType === 'Salmon and sea trout'
  if (permission.licenceLength === '12M' && !junior) {
    if (isSalmonLicense) {
      return permission.isLicenceForYou
        ? messages.important_info_contact_post_salmon_you
        : messages.important_info_contact_post_salmon_other
    }
    return permission.isLicenceForYou
      ? messages.important_info_contact_post_not_salmon_you
      : messages.important_info_contact_post_not_salmon_other
  }
  return isSalmonLicense ? messages.important_info_contact_content_salmon : messages.important_info_contact_content_not_salmon
}

const getMobileText = (permission, messages) =>
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text && permission.licenceLength === '12M'
    ? `${messages.important_info_contact_item_txt_value}${permission.licensee.mobilePhone}`
    : messages.important_info_contact_item_txt

const getEmailText = (permission, messages) =>
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email && permission.licenceLength === '12M'
    ? `${messages.important_info_contact_item_email_value}${permission.licensee.email}`
    : messages.important_info_contact_item_email

const getErrorText = (permission, messages, junior) =>
  permission.licenceLength === '12M' && !junior
    ? messages.important_info_contact_error_choose
    : messages.important_info_contact_error_choose_short

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

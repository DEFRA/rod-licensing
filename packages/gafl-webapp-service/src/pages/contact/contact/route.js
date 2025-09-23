import { CONTACT, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { mobilePhoneValidator } from '../../../processors/contact-validator.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  // We need to have set the licence length, dob and start date here to determine the contact
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

  const twelveMonthLicence = permission.licenceLength === '12M'

  return {
    title: getTitle(permission, mssgs, twelveMonthLicence),
    postHint: getPostHint(permission, mssgs),
    content: getContent(permission, mssgs, twelveMonthLicence),
    emailConfirmation: permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email,
    emailText: getEmailText(permission, mssgs, twelveMonthLicence),
    mobileConfirmation: permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text,
    mobileText: getMobileText(permission, mssgs, twelveMonthLicence),
    licensee: permission.licensee,
    isPhysical: isPhysical(permission),
    errorMessage: getErrorText(mssgs, twelveMonthLicence),
    twelveMonthLicence
  }
}

const getTitle = (permission, messages, twelveMonthLicence) => {
  if (twelveMonthLicence) {
    return permission.isLicenceForYou ? messages.important_info_contact_title_you : messages.important_info_contact_title_other
  }
  return permission.isLicenceForYou ? messages.licence_confirm_method_where_title_you : messages.licence_confirm_method_where_title_other
}

const getPostHint = (permission, messages) =>
  permission.isLicenceForYou ? messages.important_info_contact_post_hint_you : messages.important_info_contact_post_hint_other

const getContent = (permission, messages, twelveMonthLicence) => {
  // TEMP: quick sanity logging during dev
  /* eslint-disable no-console */
  console.debug('licenceLength:', permission.licenceLength, 'twelveMonthLicence:', twelveMonthLicence)
  console.debug('has i18n key important_info_contact_content_12_months:',
    Boolean(messages.important_info_contact_content_12_months))
  /* eslint-enable no-console */

  if (twelveMonthLicence) {
    // Use the unified 12-month copy if present; otherwise fall back to the old per-case text
    if (messages.important_info_contact_content_12_months) {
      return messages.important_info_contact_content_12_months
    }

    const isSalmon = permission.licenceType === 'Salmon and sea trout'
    return permission.isLicenceForYou
      ? (isSalmon
          ? messages.important_info_contact_post_salmon_you
          : messages.important_info_contact_post_not_salmon_you)
      : (isSalmon
          ? messages.important_info_contact_post_salmon_other
          : messages.important_info_contact_post_not_salmon_other)
  }

  const isSalmon = permission.licenceType === 'Salmon and sea trout'
  return isSalmon
    ? messages.important_info_contact_content_salmon
    : messages.important_info_contact_content_not_salmon
}

const getMobileText = (permission, messages, twelveMonthLicence) =>
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text && twelveMonthLicence
    ? `${messages.important_info_contact_item_txt_value}${permission.licensee.mobilePhone}`
    : messages.important_info_contact_item_txt

const getEmailText = (permission, messages, twelveMonthLicence) =>
  permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.email && twelveMonthLicence
    ? `${messages.important_info_contact_item_email_value}${permission.licensee.email}`
    : messages.important_info_contact_item_email

const getErrorText = (messages, twelveMonthLicence) =>
  twelveMonthLicence ? messages.important_info_contact_error_choose : messages.important_info_contact_error_choose_short

export const validator = Joi.object({
  'how-contacted': Joi.string().valid('email', 'text', 'post').required(),
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

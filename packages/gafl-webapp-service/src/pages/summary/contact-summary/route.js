import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

import {
  CONTACT_SUMMARY,
  LICENCE_SUMMARY,
  ADDRESS_ENTRY,
  ADDRESS_SELECT,
  ADDRESS_LOOKUP,
  CONTACT,
  NEWSLETTER,
  LICENCE_FULFILMENT,
  LICENCE_CONFIRMATION_METHOD
} from '../../../uri.js'

export const checkNavigation = (status, permission) => {
  if (!permission.isRenewal) {
    if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
      throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
    }

    if (!status[CONTACT.page]) {
      throw new GetDataRedirect(CONTACT.uri)
    }
  }

  if (isPhysical(permission)) {
    if (!status[LICENCE_FULFILMENT.page]) {
      throw new GetDataRedirect(LICENCE_FULFILMENT.uri)
    }
    if (!status[LICENCE_CONFIRMATION_METHOD.page]) {
      throw new GetDataRedirect(LICENCE_CONFIRMATION_METHOD.uri)
    }
  }
}

export const getLicenseeDetailsSummaryRows = (request, permission, countryName) => {
  const mssgs = request.i18n.getCatalog()
  const licenseeSummaryArray = [
    getRow(mssgs, mssgs.address, getAddressText(permission.licensee, countryName), addLanguageCodeToUri(request, ADDRESS_LOOKUP.uri), 'address', 'change-address'),
    ...getContactDetails(mssgs, permission, request)
  ]

  if (permission.isLicenceForYou) {
    licenseeSummaryArray.push(
      getRow(
        mssgs,
        mssgs.contact_summary_newsletter,
        permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none ? 'Yes' : 'No',
        addLanguageCodeToUri(request, NEWSLETTER.uri),
        mssgs.hidden_text_newsletter,
        'change-newsletter'
      )
    )
  }
  return licenseeSummaryArray
}

const CHANGE_CONTACT = 'change-contact'

export const getContactDetails = (mssgs, permission, request) => {
  const CONTACT_TEXT_DEFAULT = {
    EMAIL: mssgs.contact_summary_email_to,
    TEXT: mssgs.contact_summary_texts_to,
    DEFAULT: mssgs.contact_summary_default_make_note
  }
  const CONTACT_TEXT_NON_PHYSICAL = {
    EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
    TEXT: CONTACT_TEXT_DEFAULT.TEXT,
    DEFAULT: mssgs.contact_summary_default_make_note_on_conf
  }
  const CONTACT_TEXT_PHYSICAL = {
    EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
    TEXT: CONTACT_TEXT_DEFAULT.TEXT,
    DEFAULT: mssgs.contact_summary_by_post
  }
  if (isPhysical(permission)) {
    if (permission.licensee.postalFulfilment) {
      return [
        getRow(
          mssgs,
          mssgs.contact_summary_licence,
          mssgs.contact_summary_by_post,
          addLanguageCodeToUri(request, LICENCE_FULFILMENT.uri),
          mssgs.hidden_text_fulfilment_option,
          'change-licence-fulfilment-option'
        ),
        getRow(
          mssgs,
          mssgs.contact_summary_licence_confirmation,
          getContactText(mssgs, permission.licensee.preferredMethodOfConfirmation, permission.licensee),
          addLanguageCodeToUri(request, LICENCE_CONFIRMATION_METHOD.uri),
          mssgs.hidden_text_confirmation_option,
          'change-licence-confirmation-option'
        ),
        getRow(
          mssgs,
          mssgs.contact_summary_contact,
          getContactText(mssgs, permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_PHYSICAL),
          addLanguageCodeToUri(request, CONTACT.uri),
          mssgs.hidden_text_contact,
          CHANGE_CONTACT
        )
      ]
    } else {
      return [
        getRow(
          mssgs,
          mssgs.contact_summary_licence,
          getContactText(mssgs, permission.licensee.preferredMethodOfConfirmation, permission.licensee),
          addLanguageCodeToUri(request, LICENCE_FULFILMENT.uri),
          mssgs.hidden_text_confirmation_option,
          'change-licence-confirmation-option'
        ),
        getRow(
          mssgs,
          mssgs.contact_summary_contact,
          getContactText(mssgs, permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_PHYSICAL),
          addLanguageCodeToUri(request, CONTACT.uri),
          mssgs.hidden_text_contact,
          CHANGE_CONTACT
        )
      ]
    }
  } else {
    return [
      getRow(
        mssgs,
        mssgs.contact_summary_licence_details,
        getContactText(mssgs, permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_NON_PHYSICAL),
        addLanguageCodeToUri(request, CONTACT.uri),
        mssgs.hidden_text_contact,
        CHANGE_CONTACT
      )
    ]
  }
}

const getAddressText = (licensee, countryName) =>
  [licensee.premises, licensee.street, licensee.locality, licensee.town, licensee.postcode, countryName?.toUpperCase()]
    .filter(Boolean)
    .join(', ')

const getContactDisplayText = (mssgs, contactMethod) => {
  let contactDisplayText = ''
  const CONTACT_TEXT_DEFAULT = {
    EMAIL: mssgs.contact_summary_email_to,
    TEXT: mssgs.contact_summary_texts_to,
    DEFAULT: mssgs.contact_summary_default_make_note
  }

  const CONTACT_TEXT_NON_PHYSICAL = {
    EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
    TEXT: CONTACT_TEXT_DEFAULT.TEXT,
    DEFAULT: mssgs.contact_summary_default_make_note_on_conf
  }

  const CONTACT_TEXT_PHYSICAL = {
    EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
    TEXT: CONTACT_TEXT_DEFAULT.TEXT,
    DEFAULT: mssgs.contact_summary_by_post
  }
  if (contactMethod === 'Prefer not to be contacted') {
    contactDisplayText = CONTACT_TEXT_DEFAULT
  } else if (contactMethod === 'Text') {
    contactDisplayText = CONTACT_TEXT_NON_PHYSICAL
  } else {
    contactDisplayText = CONTACT_TEXT_PHYSICAL
  }
  return contactDisplayText
}

export const getContactText = (mssgs, contactMethod, licensee, contactText = null) => {
  contactText = getContactDisplayText(mssgs, contactMethod)
  if (contactMethod === HOW_CONTACTED.email) {
    return contactText.EMAIL + licensee.email
  } else if (contactMethod === HOW_CONTACTED.text) {
    return contactText.TEXT + licensee.mobilePhone
  } else {
    return contactText.DEFAULT
  }
}

const getRow = (mssgs, label, text, href, visuallyHiddenText, id) => {
  return {
    key: {
      text: label
    },
    value: {
      text
    },
    ...(href && {
      actions: {
        items: [
          {
            href,
            text: mssgs.licence_summary_change,
            visuallyHiddenText: visuallyHiddenText,
            attributes: { id }
          }
        ]
      }
    })
  }
}

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  checkNavigation(status, permission)

  status.fromSummary = CONTACT_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  const countryName = await countries.nameFromCode(permission.licensee.countryCode)

  return {
    summaryTable: getLicenseeDetailsSummaryRows(request, permission, countryName),
    uri: {
      licenceSummary: LICENCE_SUMMARY.uri
    }
  }
}

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, nextPage, getData)

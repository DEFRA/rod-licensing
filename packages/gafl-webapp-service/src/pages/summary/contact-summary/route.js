import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'

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

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  checkNavigation(status, permission)

  status.fromSummary = CONTACT_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  const countryName = await countries.nameFromCode(permission.licensee.countryCode)

  return {
    summaryTable: getLicenseeDetailsSummaryRows(permission, countryName),
    uri: {
      licenceSummary: LICENCE_SUMMARY.uri
    }
  }
}

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, nextPage, getData)

export const getLicenseeDetailsSummaryRows = (permission, countryName) => {
  const licenseeSummaryArray = [
    getRow('Address', getAddressText(permission.licensee, countryName), ADDRESS_LOOKUP.uri, 'address', 'change-address'),
    ...getContactDetails(permission)
  ]

  if (permission.isLicenceForYou) {
    licenseeSummaryArray.push(
      getRow(
        'Newsletter',
        permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none ? 'Yes' : 'No',
        NEWSLETTER.uri,
        'newsletter',
        'change-newsletter'
      )
    )
  }

  return licenseeSummaryArray
}

const CONTACT_TEXT_DEFAULT = {
  EMAIL: 'Email to ',
  TEXT: 'Text message to ',
  DEFAULT: 'Note of licence'
}

const CONTACT_TEXT_NON_PHYSICAL = {
  EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
  TEXT: 'Text messages to ',
  DEFAULT: 'Make a note on confirmation'
}

const CONTACT_TEXT_PHYSICAL = {
  EMAIL: CONTACT_TEXT_DEFAULT.EMAIL,
  TEXT: 'Text messages to ',
  DEFAULT: 'By post'
}

const CHANGE_CONTACT = 'change-contact'

const getContactDetails = permission => {
  if (isPhysical(permission)) {
    if (permission.licensee.postalFulfilment) {
      return [
        getRow('Licence', 'By post', LICENCE_FULFILMENT.uri, 'licence fulfilment option', 'change-licence-fulfilment-option'),
        getRow(
          'Licence Confirmation',
          getContactText(permission.licensee.preferredMethodOfConfirmation, permission.licensee),
          LICENCE_CONFIRMATION_METHOD.uri,
          'licence confirmation option',
          'change-licence-confirmation-option'
        ),
        getRow(
          'Contact',
          getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_PHYSICAL),
          CONTACT.uri,
          'contact',
          CHANGE_CONTACT
        )
      ]
    } else {
      return [
        getRow(
          'Licence',
          getContactText(permission.licensee.preferredMethodOfConfirmation, permission.licensee),
          LICENCE_FULFILMENT.uri,
          'licence confirmation option',
          'change-licence-confirmation-option'
        ),
        getRow(
          'Contact',
          getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_PHYSICAL),
          CONTACT.uri,
          'contact',
          CHANGE_CONTACT
        )
      ]
    }
  } else {
    return [
      getRow(
        'Licence details',
        getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, CONTACT_TEXT_NON_PHYSICAL),
        CONTACT.uri,
        'contact',
        CHANGE_CONTACT
      )
    ]
  }
}

const getAddressText = (licensee, countryName) =>
  [licensee.premises, licensee.street, licensee.locality, licensee.town, licensee.postcode, countryName?.toUpperCase()]
    .filter(Boolean)
    .join(', ')

const getContactText = (contactMethod, licensee, contactText = CONTACT_TEXT_DEFAULT) => {
  switch (contactMethod) {
    case HOW_CONTACTED.email:
      return contactText.EMAIL + licensee.email
    case HOW_CONTACTED.text:
      return contactText.TEXT + licensee.mobilePhone
    default:
      return contactText.DEFAULT
  }
}

const getRow = (label, text, href, visuallyHiddenText, id) => {
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
            text: 'Change',
            visuallyHiddenText: visuallyHiddenText,
            attributes: { id }
          }
        ]
      }
    })
  }
}

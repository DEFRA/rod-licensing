import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'

import {
  CONTACT_SUMMARY, LICENCE_SUMMARY, NAME, ADDRESS_ENTRY, ADDRESS_SELECT,
  ADDRESS_LOOKUP, CONTACT, NEWSLETTER, LICENCE_FULFILMENT, LICENCE_CONFIRMATION_METHOD
} from '../../../uri.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!status.renewal) {
    if (!status[NAME.page]) {
      throw new GetDataRedirect(NAME.uri)
    }

    if (!status[ADDRESS_ENTRY.page] && !status[ADDRESS_SELECT.page]) {
      throw new GetDataRedirect(ADDRESS_LOOKUP.uri)
    }

    if (!status[CONTACT.page]) {
      throw new GetDataRedirect(CONTACT.uri)
    }

    if (!status[NEWSLETTER.page]) {
      throw new GetDataRedirect(NEWSLETTER.uri)
    }
  }

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
  return [
    getRow('Name', permission.licensee.firstName + ' ' + permission.licensee.lastName, NAME.uri, 'name', 'change-name'),
    getRow('Address', getAddressText(permission.licensee, countryName), ADDRESS_LOOKUP.uri, 'address', 'change-address'),
    ...getContactDetails(permission),
    getRow('Newsletter', permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none ? 'Yes' : 'No', NEWSLETTER.uri, 'newsletter', 'change-newsletter')
  ]
}

const getContactDetails = (permission) => {
  if (isPhysical(permission) && permission.licensee.postalFulfilment === 'Yes') {
    return [
      getRow('Licence', 'By post',
        LICENCE_FULFILMENT.uri, 'licence fulfilment option', 'change-licence-confirmation-option'),
      getRow('Licence Confirmation',
        getContactText(permission.licensee.preferredMethodOfConfirmation, permission.licensee),
        LICENCE_CONFIRMATION_METHOD.uri, 'licence confirmation option', 'change-licence-confirmation-option'),
      getRow('Contact',
        getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, 'By post', 'Text messages to '),
        CONTACT.uri, 'contact', 'change-contact')
    ]
  } else if (isPhysical(permission) && permission.licensee.postalFulfilment === 'No') {
    return [
      getRow('Licence',
        getContactText(permission.licensee.preferredMethodOfConfirmation, permission.licensee),
        LICENCE_CONFIRMATION_METHOD.uri, 'licence confirmation option', 'change-licence-confirmation-option'),
      getRow('Contact',
        getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, 'By post', 'Text messages to '),
        CONTACT.uri, 'contact', 'change-contact')
    ]
  } else {
    return [
      getRow('Licence details',
        getContactText(permission.licensee.preferredMethodOfReminder, permission.licensee, 'Make a note on confirmation', 'Text messages to '),
        CONTACT.uri, 'contact', 'change-contact')
    ]
  }
}

const getAddressText = (licensee, countryName) => {
  return [licensee.premises, licensee.street, licensee.locality, licensee.town, licensee.postcode, countryName?.toUpperCase()].filter(Boolean).join(', ')
}

const getContactText = (contactMethod, licensee, defaultMessage = 'Note of licence', textMessage = 'Text message to ') => {
  switch (contactMethod) {
    case HOW_CONTACTED.email:
      return 'Email to ' + licensee.email
    case HOW_CONTACTED.text:
      return textMessage + licensee.mobilePhone
    default:
      return defaultMessage
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
    ...(href) && {
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
    }
  }
}

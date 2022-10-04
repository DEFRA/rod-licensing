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

class RowGenerator {
  constructor (request, permission) {
    this.request = request
    this.permission = permission
  }

  _getContactText (contactTextSpec) {
    switch (this.permission.licensee.preferredMethodOfReminder) {
      case HOW_CONTACTED.email:
        return contactTextSpec.EMAIL + this.permission.licensee.email
      case HOW_CONTACTED.text:
        return contactTextSpec.TEXT + this.permission.licensee.mobilePhone
      default:
        return contactTextSpec.DEFAULT
    }
  }

  generateRow (label, text, rawHref, visuallyHiddenText, id) {
    const href = addLanguageCodeToUri(this.request, rawHref)
    return {
      key: {
        text: label
      },
      value: {
        text: text
      },
      ...(href && {
        actions: {
          items: [
            {
              href: href,
              text: 'Change',
              visuallyHiddenText: visuallyHiddenText,
              attributes: { id: id }
            }
          ]
        }
      })
    }
  }

  generateAddressRow (countryName) {
    const { licensee } = this.permission
    const text = [licensee.premises, licensee.street, licensee.locality, licensee.town, licensee.postcode, countryName?.toUpperCase()]
      .filter(Boolean)
      .join(', ')

    return this.generateRow('Address', text, ADDRESS_LOOKUP.uri, 'address', 'change-address')
  }

  generateContactRow (label, href, visuallyHiddenText, id, contactTextSpec = CONTACT_TEXT_DEFAULT) {
    return this.generateRow(label, this._getContactText(contactTextSpec), href, visuallyHiddenText, id)
  }
}

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
    summaryTable: getLicenseeDetailsSummaryRows(permission, countryName, request),
    uri: {
      licenceSummary: LICENCE_SUMMARY.uri
    }
  }
}

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, nextPage, getData)

export const getLicenseeDetailsSummaryRows = (permission, countryName, request) => {
  const rowGenerator = new RowGenerator(request, permission)

  const licenseeSummaryArray = [rowGenerator.generateAddressRow(countryName)]
  if (isPhysical(permission)) {
    if (permission.licensee.postalFulfilment) {
      licenseeSummaryArray.push(
        rowGenerator.generateRow(
          'Licence',
          'By post',
          LICENCE_FULFILMENT.uri,
          'licence fulfilment option',
          'change-licence-fulfilment-option'
        ),
        rowGenerator.generateContactRow(
          'Licence Confirmation',
          LICENCE_CONFIRMATION_METHOD.uri,
          'licence confirmation option',
          'change-licence-confirmation-option'
        )
      )
    } else {
      licenseeSummaryArray.push(
        rowGenerator.generateContactRow(
          'Licence',
          LICENCE_FULFILMENT.uri,
          'licence confirmation option',
          'change-licence-confirmation-option'
        )
      )
    }

    licenseeSummaryArray.push(rowGenerator.generateContactRow('Contact', CONTACT.uri, 'contact', CHANGE_CONTACT, CONTACT_TEXT_PHYSICAL))
  } else {
    licenseeSummaryArray.push(
      rowGenerator.generateContactRow('Licence details', CONTACT.uri, 'contact', CHANGE_CONTACT, CONTACT_TEXT_NON_PHYSICAL)
    )
  }

  if (permission.isLicenceForYou) {
    const text = permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none ? 'Yes' : 'No'
    licenseeSummaryArray.push(rowGenerator.generateRow('Newsletter', text, NEWSLETTER.uri, 'newsletter', 'change-newsletter'))
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

import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { countries } from '../../../processors/refdata-helper.js'
import { HOW_CONTACTED } from '../../../processors/mapping-constants.js'
import { CONTACT_SUMMARY_SEEN } from '../../../constants.js'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { isMultibuyForYou } from '../../../handlers/multibuy-for-you-handler.js'
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
  LICENCE_CONFIRMATION_METHOD,
  CHANGE_CONTACT_DETAILS
} from '../../../uri.js'

const CONTACT_TEXT_DEFAULT = {
  EMAIL: 'contact_summary_email',
  TEXT: 'contact_summary_text_sngl',
  DEFAULT: 'contact_summary_license_default'
}

const CONTACT_TEXT_NON_PHYSICAL = {
  EMAIL: 'contact_summary_email',
  TEXT: 'contact_summary_text_plrl',
  DEFAULT: 'contact_summary_license_non_physical'
}

const CONTACT_TEXT_PHYSICAL = {
  EMAIL: 'contact_summary_email',
  TEXT: 'contact_summary_text_plrl',
  DEFAULT: 'contact_summary_license_physical'
}

const CHANGE_CONTACT = 'change-contact'
class RowGenerator {
  constructor (request, permission) {
    this.request = request
    this.permission = permission
    this.labels = request.i18n.getCatalog()
  }

  _getContactText (contactTextSpec) {
    switch (this.permission.licensee.preferredMethodOfReminder) {
      case HOW_CONTACTED.email:
        return `${this.labels[contactTextSpec.EMAIL]}${this.permission.licensee.email}`
      case HOW_CONTACTED.text:
        return `${this.labels[contactTextSpec.TEXT]}${this.permission.licensee.mobilePhone}`
      default:
        return this.labels[contactTextSpec.DEFAULT]
    }
  }

  _generateRow (label, text, rawHref, visuallyHiddenText, id) {
    const href = addLanguageCodeToUri(this.request, rawHref)
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
              visuallyHiddenText,
              text: this.labels.contact_summary_change,
              attributes: { id }
            }
          ]
        }
      })
    }
  }

  generateStandardRow (label, text, rawHref, visuallyHiddenText, id) {
    return this._generateRow(this.labels[label], this.labels[text], rawHref, this.labels[visuallyHiddenText], id)
  }

  generateAddressRow (countryName) {
    const { licensee } = this.permission
    const text = [licensee.premises, licensee.street, licensee.locality, licensee.town, licensee.postcode, countryName?.toUpperCase()]
      .filter(Boolean)
      .join(', ')

    return this._generateRow(
      this.labels.contact_summary_row_address,
      text,
      ADDRESS_LOOKUP.uri,
      this.labels.contact_summary_hidden_address,
      'change-address'
    )
  }

  generateContactRow (label, href, visuallyHiddenText, id, contactTextSpec = CONTACT_TEXT_DEFAULT) {
    return this._generateRow(this.labels[label], this._getContactText(contactTextSpec), href, this.labels[visuallyHiddenText], id)
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

const getLicenseeDetailsSummaryRows = (permission, countryName, request) => {
  const rowGenerator = new RowGenerator(request, permission)
  const licenseeSummaryArray = [rowGenerator.generateAddressRow(countryName)]

  if (isPhysical(permission)) {
    if (permission.licensee.postalFulfilment) {
      licenseeSummaryArray.push(
        rowGenerator.generateStandardRow(
          'contact_summary_row_licence',
          'contact_summary_license_physical',
          LICENCE_FULFILMENT.uri,
          'contact_summary_hidden_licence_fulfilment',
          'change-licence-fulfilment-option'
        ),
        rowGenerator.generateContactRow(
          'contact_summary_row_licence_conf',
          LICENCE_CONFIRMATION_METHOD.uri,
          'contact_summary_hidden_licence_confirmation',
          'change-licence-confirmation-option'
        )
      )
    } else {
      licenseeSummaryArray.push(
        rowGenerator.generateContactRow(
          'contact_summary_row_licence',
          LICENCE_FULFILMENT.uri,
          'contact_summary_hidden_licence_confirmation',
          'change-licence-confirmation-option'
        )
      )
    }

    licenseeSummaryArray.push(
      rowGenerator.generateContactRow(
        'contact_summary_row_contact',
        CONTACT.uri,
        'contact_summary_hidden_contact',
        CHANGE_CONTACT,
        CONTACT_TEXT_PHYSICAL
      )
    )
  } else {
    licenseeSummaryArray.push(
      rowGenerator.generateContactRow(
        'contact_summary_row_licence_details',
        CONTACT.uri,
        'contact_summary_hidden_contact',
        CHANGE_CONTACT,
        CONTACT_TEXT_NON_PHYSICAL
      )
    )
  }

  if (permission.isLicenceForYou) {
    const text = permission.licensee.preferredMethodOfNewsletter !== HOW_CONTACTED.none ? 'yes' : 'no'
    licenseeSummaryArray.push(
      rowGenerator.generateStandardRow(
        'contact_summary_row_newsletter',
        text,
        NEWSLETTER.uri,
        'contact_summary_hidden_newsletter',
        'change-newsletter'
      )
    )
  }

  return licenseeSummaryArray
}

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // All of this is untested and so would be very easy to inadvertently delete
  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === true) {
    const transaction = await request.cache().helpers.transaction.get()
    const { licensee } = transaction.permissions.find(p => p.isLicenceForYou)
    permission.licensee = { ...licensee }
    const pagesToSkip = [ADDRESS_ENTRY.page, ADDRESS_SELECT.page, CONTACT.page, LICENCE_CONFIRMATION_METHOD.page]
    for (const page of pagesToSkip) {
      status[page] = true
    }

    await request.cache().helpers.transaction.setCurrentPermission(permission)
  } else {
    checkNavigation(status, permission)
  }

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

export default pageRoute(CHANGE_CONTACT_DETAILS.page, CHANGE_CONTACT_DETAILS.uri, null, nextPage, getData)

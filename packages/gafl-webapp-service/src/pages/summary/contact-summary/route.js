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

const META_TAG_TELEPHONE_NO = '<meta name="format-detection" content="telephone=no">'

export class RowGenerator {
  constructor (request, permission) {
    this.request = request
    this.permission = permission
    this.labels = request.i18n.getCatalog()
  }

  _getPreferredMethodOfReminderText (contactTextSpec) {
    switch (this.permission.licensee.preferredMethodOfReminder) {
      case HOW_CONTACTED.email:
        return `${this.labels[contactTextSpec.EMAIL]}${this.permission.licensee.email}`
      case HOW_CONTACTED.text:
        return `${this.labels[contactTextSpec.TEXT]}${this.permission.licensee.mobilePhone}`
      default:
        return this.labels[contactTextSpec.DEFAULT]
    }
  }

  _getPreferredMethodOfConfirmation (contactTextSpec) {
    switch (this.permission.licensee.preferredMethodOfConfirmation) {
      case HOW_CONTACTED.email:
        return `${this.labels[contactTextSpec.EMAIL]}${this.permission.licensee.email}`
      case HOW_CONTACTED.text:
        return `${this.labels[contactTextSpec.TEXT]}${this.permission.licensee.mobilePhone}`
      default:
        return this.labels[contactTextSpec.DEFAULT]
    }
  }

  _generateRow ({ label, text, rawHref, visuallyHiddenText, id, includeMeta = false }) {
    const href = addLanguageCodeToUri(this.request, rawHref)
    const row = {
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

    if (includeMeta) {
      row.value.meta = META_TAG_TELEPHONE_NO
    }

    return row
  }

  generateStandardRow (label, text, rawHref, visuallyHiddenText, id) {
    return this._generateRow({
      label: this.labels[label],
      text: this.labels[text],
      rawHref,
      visuallyHiddenText: this.labels[visuallyHiddenText],
      id
    })
  }

  generateAddressRow (countryName) {
    const { licensee } = this.permission
    
    const text = [
      licensee.premises?.toLowerCase(),
      licensee.street?.toLowerCase(),
      licensee.locality?.toLowerCase(),
      licensee.town?.toLowerCase(),
      licensee.postcode?.toUpperCase(),
      countryName?.toUpperCase()
    ]
      .filter(Boolean)
      .join(', ')

    return this._generateRow({
      label: this.labels.contact_summary_row_address,
      text,
      rawHref: ADDRESS_LOOKUP.uri,
      visuallyHiddenText: this.labels.contact_summary_hidden_address,
      id: 'change-address'
    })
  }

  generateContactRow ({ label, href, visuallyHiddenText, id, contactTextSpec = CONTACT_TEXT_DEFAULT, includeMeta = false }) {
    const contactText =
      label === 'contact_summary_row_contact'
        ? this._getPreferredMethodOfReminderText(contactTextSpec)
        : this._getPreferredMethodOfConfirmation(contactTextSpec)
    return this._generateRow({
      label: this.labels[label],
      text: contactText,
      rawHref: href,
      visuallyHiddenText: this.labels[visuallyHiddenText],
      id,
      includeMeta
    })
  }
}

const checkNavigation = (status, permission) => {
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
  const confirmationText = permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.text
  const reminderText = permission.licensee.preferredMethodOfReminder === HOW_CONTACTED.text
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
        rowGenerator.generateContactRow({
          label: 'contact_summary_row_licence_conf',
          href: LICENCE_CONFIRMATION_METHOD.uri,
          visuallyHiddenText: 'contact_summary_hidden_licence_confirmation',
          id: 'change-licence-confirmation-option',
          includeMeta: confirmationText
        })
      )
    } else {
      licenseeSummaryArray.push(
        rowGenerator.generateContactRow({
          label: 'contact_summary_row_licence',
          href: LICENCE_FULFILMENT.uri,
          visuallyHiddenText: 'contact_summary_hidden_licence_confirmation',
          id: 'change-licence-confirmation-option',
          includeMeta: confirmationText
        })
      )
    }

    licenseeSummaryArray.push(
      rowGenerator.generateContactRow({
        label: 'contact_summary_row_contact',
        href: CONTACT.uri,
        visuallyHiddenText: 'contact_summary_hidden_contact',
        id: CHANGE_CONTACT,
        contactTextSpec: CONTACT_TEXT_PHYSICAL,
        includeMeta: reminderText
      })
    )
  } else {
    licenseeSummaryArray.push(
      rowGenerator.generateContactRow({
        label: 'contact_summary_row_licence_details',
        href: CONTACT.uri,
        visuallyHiddenText: 'contact_summary_hidden_contact',
        id: CHANGE_CONTACT,
        contactTextSpec: CONTACT_TEXT_NON_PHYSICAL,
        includeMeta: reminderText
      })
    )
  }

  if (permission.isLicenceForYou) {
    const text = permission.licensee.preferredMethodOfNewsletter === HOW_CONTACTED.none ? 'no' : 'yes'
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
  const mssgs = request.i18n.getCatalog()

  checkNavigation(status, permission)

  status.fromSummary = CONTACT_SUMMARY_SEEN
  await request.cache().helpers.status.setCurrentPermission(status)
  const countryName = await countries.nameFromCode(permission.licensee.countryCode)

  const changeLicenceDetails = permission.isLicenceForYou ? mssgs.change_licence_details_you : mssgs.change_licence_details_other

  return {
    summaryTable: getLicenseeDetailsSummaryRows(permission, countryName, request),
    uri: {
      licenceSummary: addLanguageCodeToUri(request, LICENCE_SUMMARY.uri)
    },
    changeLicenceDetails
  }
}

export default pageRoute(CONTACT_SUMMARY.page, CONTACT_SUMMARY.uri, null, nextPage, getData)

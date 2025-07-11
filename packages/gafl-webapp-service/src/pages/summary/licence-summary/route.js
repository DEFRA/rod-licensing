import moment from 'moment-timezone'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import findPermit from '../../../processors/find-permit.js'
import hashPermission from '../../../processors/hash-permission.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import {
  NAME,
  LICENCE_SUMMARY,
  LICENCE_LENGTH,
  LICENCE_TYPE,
  LICENCE_TO_START,
  DISABILITY_CONCESSION,
  DATE_OF_BIRTH,
  RENEWAL_START_DATE,
  NEW_TRANSACTION
} from '../../../uri.js'
import { START_AFTER_PAYMENT_MINUTES } from '@defra-fish/business-rules-lib'
import { LICENCE_SUMMARY_SEEN } from '../../../constants.js'
import { CONCESSION, CONCESSION_PROOF } from '../../../processors/mapping-constants.js'
import { nextPage } from '../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import { displayPermissionPrice } from '../../../processors/price-display.js'
import { hasJunior } from '../../../processors/concession-helper.js'

class RowGenerator {
  constructor (request, permission) {
    this.request = request
    this.permission = permission
    this.labels = request.i18n.getCatalog()
    this.disabled = this.permission.concessions && this.permission.concessions.find(c => c.type === CONCESSION.DISABLED)
  }

  _generateRow (label, text, rawHref, visuallyHiddenText, id) {
    const href = rawHref && addLanguageCodeToUri(this.request, rawHref)
    return {
      key: {
        text: label
      },
      value: {
        html: text
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

  _getStartDateText () {
    const isContinuing = !!this.permission.renewedEndDate && this.permission.renewedEndDate === this.permission.licenceStartDate
    if (this.permission.licenceToStart === 'after-payment') {
      return `${START_AFTER_PAYMENT_MINUTES}${this.labels.licence_summary_minutes_after_payment}`
    } else if (isContinuing && this.permission.isRenewal) {
      return `${displayStartTime(this.request, this.permission)}</br><span class="govuk-caption-m">${
        this.labels.licence_summary_immediately_after_expire
      }</span>`
    }
    return displayStartTime(this.request, this.permission)
  }

  _getConcessionText () {
    if (this.disabled?.proof?.type === CONCESSION_PROOF.blueBadge) {
      return this.labels.licence_summary_blue_badge
    } else if (this.disabled?.proof?.type === CONCESSION_PROOF.NI) {
      return this.labels.licence_summary_ni_num
    }
    return this.labels.licence_summary_disability_concession
  }

  generateStandardRow (label, text, rawHref, id) {
    return this._generateRow(this.labels[label], text, rawHref, this.labels[label], id)
  }

  generateStartDateRow () {
    const href = this.permission.isRenewal ? RENEWAL_START_DATE.uri : LICENCE_TO_START.uri
    return this._generateRow(
      this.labels.licence_summary_start_date,
      this._getStartDateText(),
      href,
      this.labels.licence_summary_start_date,
      'change-licence-to-start'
    )
  }

  generateConcessionRow () {
    const label = (() => {
      if (this.disabled?.proof?.type === CONCESSION_PROOF.blueBadge) {
        return this.labels.licence_summary_blue_badge_eligible
      }
      if (this.disabled?.proof?.type === CONCESSION_PROOF.NI) {
        return this.disabled.proof.referenceNumber
      }
      return this.labels.licence_summary_none
    })()

    const concessionText = this._getConcessionText()
    return this._generateRow(concessionText, label, DISABILITY_CONCESSION.uri, concessionText, 'change-benefit-check')
  }

  generateCostRow () {
    return this._generateRow(
      this.labels.cost,
      displayPermissionPrice(
        {
          startDate: this.permission.licenceStartDate,
          permit: this.permission.permit
        },
        this.labels
      )
    )
  }

  generateLicenceLengthRow () {
    const args = ['licence_summary_length', this.labels[`licence_type_${this.permission.licenceLength.toLowerCase()}`]]

    if (this.permission.numberOfRods !== '3' && !hasJunior(this.permission)) {
      args.push(LICENCE_LENGTH.uri, 'change-licence-length')
    }

    return this.generateStandardRow(...args)
  }
}

// Extracted to keep sonar happy
export const checkNavigation = permission => {
  if (!permission.licensee.firstName || !permission.licensee.lastName) {
    throw new GetDataRedirect(NAME.uri)
  }

  if (!permission.licensee.birthDate) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!permission.numberOfRods || !permission.licenceType) {
    throw new GetDataRedirect(LICENCE_TYPE.uri)
  }

  if (!permission.licenceLength) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }
}

const getLicenceSummaryRows = (request, permission) => {
  const rows = []
  const { licensee } = permission

  const rg = new RowGenerator(request, permission)
  rows.push(rg.generateStandardRow('licence_summary_name', `${licensee.firstName} ${licensee.lastName}`, NAME.uri, 'change-name'))
  if (!permission.isRenewal) {
    const birthDateStr = moment(permission.licensee.birthDate).locale(request.locale).format('Do MMMM YYYY')
    rows.push(rg.generateStandardRow('licence_summary_dob', birthDateStr, DATE_OF_BIRTH.uri, 'change-birth-date'))
  }
  rows.push(
    rg.generateStandardRow(
      'licence_summary_type',
      licenceTypeDisplay(permission, request.i18n.getCatalog()),
      LICENCE_TYPE.uri,
      'change-licence-type'
    )
  )
  rows.push(rg.generateLicenceLengthRow())
  rows.push(rg.generateStartDateRow())
  if (permission.licenceLength === '12M') {
    rows.push(rg.generateConcessionRow())
  }
  rows.push(rg.generateCostRow())
  return rows
}

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  if (!permission.isRenewal) {
    /*
     * Before we try and filter the permit it is necessary to check that the user has navigated through
     * the journey in such a way as to have gather all the required data. They may have manipulated the
     * journey by typing into the address bar in which case they will be redirected back to the
     * appropriate point in the journey. For a renewal this is not necessary.
     */
    checkNavigation(permission)
  }

  status.fromSummary = getFromSummary(status.fromSummary, permission.isRenewal)
  await request.cache().helpers.status.setCurrentPermission(status)
  const hash = hashPermission(permission)
  if (permission.hash !== hash) {
    permission.permit = await findPermit(permission)
    permission.hash = hash
    await request.cache().helpers.transaction.setCurrentPermission(permission)
  }

  return {
    licenceSummaryRows: getLicenceSummaryRows(request, permission),
    isRenewal: permission.isRenewal,
    uri: {
      clear: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

const getFromSummary = (fromSummary, isRenewal) => {
  if (isRenewal) {
    return LICENCE_SUMMARY_SEEN
  }
  if (fromSummary) {
    return fromSummary
  }
  return LICENCE_SUMMARY_SEEN
}

export default pageRoute(LICENCE_SUMMARY.page, LICENCE_SUMMARY.uri, null, nextPage, getData)

import * as mappings from '../../../processors/mapping-constants.js'
import { LICENCE_LENGTH, LICENCE_FULFILMENT } from '../../../uri.js'
import * as concessionHelper from '../../../processors/concession-helper.js'
import moment from 'moment-timezone'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { isPhysical } from '../../../processors/licence-type-display.js'
import { licenceToStart } from '../licence-to-start/update-transaction.js'
import { findPermit } from '../../../processors/find-permit.js'

/**
 * If we have set the licence type to physical change the method of contact from 'none' to 'letter' and vice-versa
 * @param permission
 */
const checkContactDetails = permission => {
  const preferredMethodOfConfirmation = permission?.licensee?.preferredMethodOfConfirmation
  const preferredMethodOfReminder = permission?.licensee?.preferredMethodOfReminder

  const physicalContactNone =
    isPhysical(permission) &&
    (preferredMethodOfConfirmation === mappings.HOW_CONTACTED.none || preferredMethodOfReminder === mappings.HOW_CONTACTED.none)

  if (physicalContactNone) {
    permission.licensee.postalFulfilment = true
    permission.licensee.preferredMethodOfConfirmation = mappings.HOW_CONTACTED.letter
    permission.licensee.preferredMethodOfReminder = mappings.HOW_CONTACTED.letter
  }

  const digitalContactLeter =
    !isPhysical(permission) &&
    (preferredMethodOfConfirmation === mappings.HOW_CONTACTED.letter || preferredMethodOfReminder === mappings.HOW_CONTACTED.letter)

  if (digitalContactLeter) {
    permission.licensee.postalFulfilment = false
    permission.licensee.preferredMethodOfConfirmation = mappings.HOW_CONTACTED.none
    permission.licensee.preferredMethodOfReminder = mappings.HOW_CONTACTED.none
  }
}

/**
 *  If the licence start date has be chosen as today, and the licence is changed to a
 *  12 month then set the start after payment flag
 * @param permission
 */
const checkLicenceToStart = permission => {
  if (permission.licenceLength === '12M') {
    permission.licenceStartTime = null
    if (moment(permission.licenceStartDate, cacheDateFormat).tz(SERVICE_LOCAL_TIME).isSame(moment().tz(SERVICE_LOCAL_TIME), 'day')) {
      permission.licenceToStart = licenceToStart.AFTER_PAYMENT
    }
  }
}

/*
 * If a disabled concession is set and the licence is moved to an 1/8 day then store the concession and restore it
 * if the concession is set back
 */
const checkDisabledConcessions = permission => {
  if (permission.licenceLength !== '12M' && concessionHelper.hasDisabled(permission)) {
    permission.previouslyDisabled = permission.concessions.find(c => c.type === mappings.CONCESSION.DISABLED)
    concessionHelper.removeDisabled(permission)
  }

  if (permission.licenceLength === '12M' && !concessionHelper.hasDisabled(permission) && permission.previouslyDisabled) {
    permission.concessions.push(permission.previouslyDisabled)
    permission.previouslyDisabled = null
  }

  // For a trout and coarse, setting the licence length to anything other than 12 months sets the 2 rod licence
  if (permission.licenceLength !== '12M' && permission.licenceType === mappings.LICENCE_TYPE['trout-and-coarse']) {
    permission.numberOfRods = '2'
  }
}

export const onLengthChange = permission => {
  checkLicenceToStart(permission)
  checkContactDetails(permission)
  checkDisabledConcessions(permission)
}

/**
 * Transfer the validate page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_LENGTH.page)
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  permission.licenceLength = payload['licence-length']
  console.log('permission ', permission)
  const foundPermit = await findPermit(permission, request)
  console.log('foundPermit ', foundPermit)
  onLengthChange(foundPermit)

  // Clear the licence fulfilment here otherwise it can end up being set incorrectly
  await request.cache().helpers.status.setCurrentPermission({ [LICENCE_FULFILMENT.page]: false })

  await request.cache().helpers.transaction.setCurrentPermission(foundPermit)
}

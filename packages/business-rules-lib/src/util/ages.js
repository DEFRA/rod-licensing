import { ADVANCED_PURCHASE_MAX_DAYS, CONCESSION, CONCESSION_PROOF, HOW_CONTACTED, SERVICE_LOCAL_TIME } from '../constants.js'
import moment from 'moment-timezone'

/** The maximum age at which an angler is considered to be a minor (free licence) */
export const MINOR_MAX_AGE = 12
/** The maximum age at which an angler is entitled to a junior concession */
export const JUNIOR_MAX_AGE = 16
/** The minimum age at which an angler becomes entitled to a senior concession */
export const SENIOR_MIN_AGE = 66

export const addDisabled = (permission, concessionProof, referenceNumber) => {
  removeDisabled(permission)
  if (!permission.concessions) {
    permission.concessions = []
  }
  permission.concessions.push({
    type: CONCESSION.DISABLED,
    proof: {
      type: concessionProof,
      referenceNumber: referenceNumber
    }
  })
}

export const hasDisabled = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.DISABLED)

export const removeDisabled = permission => {
  if (hasDisabled(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.DISABLED)
  }
}

export const getAgeConcession = permission =>
  permission.concessions ? permission.concessions.find(c => [CONCESSION.JUNIOR, CONCESSION.SENIOR].includes(c.type)) : undefined

/**
 * Determine if the provided age is classified as a minor
 * @param {number} age The age to be tested
 * @returns {boolean} true if the given age should be classified as a minor
 */
export const isMinor = age => age <= MINOR_MAX_AGE

/**
 * Determine if the provided age is classified as a junior
 * @param {number} age The age to be tested
 * @returns {boolean} true if the given age should be classified as a junior
 */
export const isJunior = age => age > MINOR_MAX_AGE && age <= JUNIOR_MAX_AGE

/**
 * Determine if the provided age is classified as a senior
 * @param {number} age The age to be tested
 * @returns {boolean} true if the given age should be classified as a senior
 */
export const isSenior = age => age >= SENIOR_MIN_AGE

export const clear = permission => {
  delete permission.concessions
}

export const addJunior = permission => {
  if (!hasJunior(permission)) {
    removeSenior(permission)
    if (!permission.concessions) {
      permission.concessions = []
    }
    permission.concessions.push({
      type: CONCESSION.JUNIOR,
      proof: {
        type: CONCESSION_PROOF.none
      }
    })
  }
}

export const hasJunior = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.JUNIOR)

export const removeJunior = permission => {
  if (hasJunior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.JUNIOR)
  }
}

export const addSenior = permission => {
  if (!hasSenior(permission)) {
    removeJunior(permission)
    if (!permission.concessions) {
      permission.concessions = []
    }
    permission.concessions.push({
      type: CONCESSION.SENIOR,
      proof: {
        type: CONCESSION_PROOF.none
      }
    })
  }
}

export const hasSenior = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.SENIOR)

export const removeSenior = permission => {
  if (hasSenior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.SENIOR)
  }
}

export const ageConcessionHelper = permission => {
  delete permission.licensee.noLicenceRequired
  const ageAtLicenceStartDate = permission.licenceStartDate
    ? moment(permission.licenceStartDate).diff(moment(permission.licensee.birthDate), 'years')
    : moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days').diff(moment(permission.licensee.birthDate), 'years')

  if (isMinor(ageAtLicenceStartDate)) {
    // Just flag as being under 13 for the router
    clear(permission)
    Object.assign(permission.licensee, { noLicenceRequired: true })
  } else if (isJunior(ageAtLicenceStartDate)) {
    // Juniors always get a 12 months licence
    Object.assign(permission, { licenceLength: '12M', licenceStartTime: '0' })
    addJunior(permission)
    // Junior licences are not sent out by post so if the contact details are by letter then reset to none
    if (permission.licensee.preferredMethodOfConfirmation === HOW_CONTACTED.letter) {
      permission.licensee.preferredMethodOfConfirmation = HOW_CONTACTED.none
      permission.licensee.preferredMethodOfReminder = HOW_CONTACTED.none
    }
  } else if (isSenior(ageAtLicenceStartDate)) {
    addSenior(permission)
  } else {
    removeJunior(permission)
    removeSenior(permission)
  }
}

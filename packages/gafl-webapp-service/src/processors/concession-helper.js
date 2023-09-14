import { CONCESSION, CONCESSION_PROOF, HOW_CONTACTED } from './mapping-constants.js'
import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME, isJunior, isMinor, isSenior, ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'

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

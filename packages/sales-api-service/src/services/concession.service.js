import { CONCESSION, CONCESSION_PROOF } from './constants.js'
import { getReferenceDataForEntityAndId } from './reference-data.service.js'
import { Concession } from '@defra-fish/dynamics-lib'

export const addConcessionProofs = async permission => {
  permission.concessions.forEach(async concessionProof => {
    const concessionReference = await getReferenceDataForEntityAndId(Concession, concessionProof.id)
    if (concessionReference && concessionReference.name === CONCESSION.DISABLED) {
      addDisabled(permission, concessionProof.proof.type.label, concessionProof.proof.referenceNumber)
    }
  })
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

export const removeDisabled = permission => {
  if (hasDisabled(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.DISABLED)
  }
}

export const hasDisabled = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.DISABLED)

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

export const removeSenior = permission => {
  if (hasSenior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.SENIOR)
  }
}

export const hasSenior = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.SENIOR)

export const removeJunior = permission => {
  if (hasJunior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.JUNIOR)
  }
}

export const hasJunior = permission => permission.concessions && !!permission.concessions.find(c => c.type === CONCESSION.JUNIOR)

//  clear, getAgeConcession and addJunior to be added this file?

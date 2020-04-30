import { CONCESSION, CONCESSION_PROOF } from './mapping-constants.js'
/*
 * I don't normally like this kind of code but this provides a single point at which a change can be made to
 * move to a situation where multiple concessions are enabled
 */
const clear = permission => {
  delete permission.concessions
}

const addJunior = permission => {
  if (!hasJunior(permission)) {
    if (hasSenior(permission)) {
      removeSenior(permission)
    }
    if (hasDisabled(permission)) {
      removeDisabled(permission)
    }
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

const hasJunior = permission => permission.concessions && permission.concessions.find(c => c.type === CONCESSION.JUNIOR)

const removeJunior = permission => {
  if (hasJunior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.JUNIOR)
  }
}

const addSenior = permission => {
  if (!hasSenior(permission)) {
    if (hasJunior(permission)) {
      removeJunior(permission)
    }
    if (hasDisabled(permission)) {
      removeDisabled(permission)
    }
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

const hasSenior = permission => permission.concessions && permission.concessions.find(c => c.type === CONCESSION.SENIOR)

const removeSenior = permission => {
  if (hasSenior(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.SENIOR)
  }
}

const addDisabled = (permission, concessionProof, referenceNumber) => {
  if (hasDisabled(permission)) {
    removeDisabled(permission)
  }
  if (hasJunior(permission)) {
    removeJunior(permission)
  }
  if (hasSenior(permission)) {
    removeSenior(permission)
  }
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

const hasDisabled = permission => permission.concessions && permission.concessions.find(c => c.type === CONCESSION.DISABLED)

const removeDisabled = permission => {
  if (hasDisabled(permission)) {
    permission.concessions = permission.concessions.filter(c => c.type !== CONCESSION.DISABLED)
  }
}

export { clear, addJunior, hasJunior, removeJunior, addSenior, hasSenior, removeSenior, addDisabled, hasDisabled, removeDisabled }

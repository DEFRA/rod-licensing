import { CONCESSION, CONCESSION_PROOF } from './mapping-constants.js'
/*
 * I don't normally like this kind of code but this provides a single point at which a change can be made to
 * move to a situation where multiple concessions are enabled
 */
const clear = licensee => {
  delete licensee.concessions
}

const addJunior = licensee => {
  if (!hasJunior(licensee)) {
    if (hasSenior(licensee)) {
      removeSenior(licensee)
    }
    if (hasDisabled(licensee)) {
      removeDisabled(licensee)
    }
    if (!licensee.concessions) {
      licensee.concessions = []
    }
    licensee.concessions.push({
      type: CONCESSION.JUNIOR,
      proof: {
        type: CONCESSION_PROOF.none
      }
    })
  }
}

const hasJunior = licensee => licensee.concessions && licensee.concessions.find(c => c.type === CONCESSION.JUNIOR)

const removeJunior = licensee => {
  if (hasJunior(licensee)) {
    licensee.concessions = licensee.concessions.filter(c => c.type !== CONCESSION.JUNIOR)
  }
}

const addSenior = licensee => {
  if (!hasSenior(licensee)) {
    if (hasJunior(licensee)) {
      removeJunior(licensee)
    }
    if (hasDisabled(licensee)) {
      removeDisabled(licensee)
    }
    if (!licensee.concessions) {
      licensee.concessions = []
    }
    licensee.concessions.push({
      type: CONCESSION.SENIOR,
      proof: {
        type: CONCESSION_PROOF.none
      }
    })
  }
}

const hasSenior = licensee => licensee.concessions && licensee.concessions.find(c => c.type === CONCESSION.SENIOR)

const removeSenior = licensee => {
  if (hasSenior(licensee)) {
    licensee.concessions = licensee.concessions.filter(c => c.type !== CONCESSION.SENIOR)
  }
}

const addDisabled = (licensee, concessionProof, referenceNumber) => {
  if (hasDisabled(licensee)) {
    removeDisabled(licensee)
  }
  if (hasJunior(licensee)) {
    removeJunior(licensee)
  }
  if (hasSenior(licensee)) {
    removeSenior(licensee)
  }
  if (!licensee.concessions) {
    licensee.concessions = []
  }
  licensee.concessions.push({
    type: CONCESSION.DISABLED,
    proof: {
      type: concessionProof,
      referenceNumber: referenceNumber
    }
  })
}

const hasDisabled = licensee => licensee.concessions && licensee.concessions.find(c => c.type === CONCESSION.DISABLED)

const removeDisabled = licensee => {
  if (hasDisabled(licensee)) {
    licensee.concessions = licensee.concessions.filter(c => c.type !== CONCESSION.DISABLED)
  }
}

export { clear, addJunior, hasJunior, removeJunior, addSenior, hasSenior, removeSenior, addDisabled, hasDisabled, removeDisabled }

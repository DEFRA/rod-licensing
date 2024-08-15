import { CONCESSION, CONCESSION_PROOF } from './constants.js'
import { getReferenceDataForEntity } from './reference-data.service.js'
import { Concession } from '@defra-fish/dynamics-lib'

const getTypeConcessionId = async type => {
  const concessions = await getReferenceDataForEntity(Concession)
  const { id } = concessions.find(c => c.name === type)
  return id
}

const hasConcessionType = async (permission, type) => {
  const id = await getTypeConcessionId(type)
  return !!permission.concessions && permission.concessions.some(c => c.id === id)
}

const removeConcessionType = async (permission, type) => {
  if (await hasConcessionType(permission, type)) {
    const id = await getTypeConcessionId(type)
    permission.concessions = permission.concessions.filter(c => c.id !== id)
  }
}

export const addDisabled = async (permission, concessionProof, referenceNumber) => {
  await removeDisabled(permission)
  if (!permission.concessions) {
    permission.concessions = []
  }
  permission.concessions.push({
    id: await getTypeConcessionId(CONCESSION.DISABLED),
    name: CONCESSION.DISABLED,
    proof: {
      type: concessionProof,
      referenceNumber
    }
  })
}

export const removeDisabled = permission => removeConcessionType(permission, CONCESSION.DISABLED)
export const hasDisabled = permission => hasConcessionType(permission, CONCESSION.DISABLED)

export const addSenior = async permission => {
  if (!(await hasSenior(permission))) {
    await removeJunior(permission)
    if (!permission.concessions) {
      permission.concessions = []
    }
    permission.concessions.push({
      id: await getTypeConcessionId(CONCESSION.SENIOR),
      name: CONCESSION.SENIOR,
      proof: {
        type: CONCESSION_PROOF.none
      }
    })
  }
}

export const removeSenior = permission => removeConcessionType(permission, CONCESSION.SENIOR)
export const hasSenior = permission => hasConcessionType(permission, CONCESSION.SENIOR)

export const removeJunior = permission => removeConcessionType(permission, CONCESSION.JUNIOR)
export const hasJunior = permission => hasConcessionType(permission, CONCESSION.JUNIOR)

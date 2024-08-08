import { getReferenceDataForEntity } from './reference-data.service.js'
import { Permit, Concession, PermitConcession } from '@defra-fish/dynamics-lib'

export const findPermit = async existingPermission => {
  const licenseeConcessions = existingPermission.concessions || []
  const permitsJoinPermitConcessions = await getPermitsJoinPermitConcessions()

  // Filter the joined list to include every and only those concessions in licenseeConcessions
  const filteredPermitsJoinPermitConcessions = permitsJoinPermitConcessions.filter(
    pjpc =>
      licenseeConcessions.map(lc => lc.type).every(t => pjpc.concessions.map(c => c.name).includes(t)) &&
      pjpc.concessions.length === licenseeConcessions.length
  )

  // Filter by the licence length
  const byLicenceLength = filteredPermitsJoinPermitConcessions.filter(
    p => String(p.durationMagnitude + p.durationDesignator.description) === '12M'
  )

  // Filter by the licence (sub) type
  const byLicenceType = byLicenceLength.filter(p => p.permitSubtype.label === existingPermission.permit.permitSubtype.label)

  // Filter by the number of rods
  const byNumberOfRods = byLicenceType.filter(r => String(r.numberOfRods) === String(existingPermission.permit.numberOfRods))

  return byNumberOfRods[0]
}

const getPermitsJoinPermitConcessions = async () => {
  const permits = await getReferenceDataForEntity(Permit)
  const permitConcessions = await getReferenceDataForEntity(PermitConcession)
  const concessions = await getReferenceDataForEntity(Concession)
  return permits.map(p => ({
    ...p,
    concessions: permitConcessions.filter(pc => pc.permitId === p.id).map(pc => concessions.find(c => c.id === pc.concessionId))
  }))
}

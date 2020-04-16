import { CONCESSION } from '../../../constants.js'

export default async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (licensee.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!licensee.concession || !licensee.concession.type || licensee.concession.type === CONCESSION.DISABLED) {
    result = status.fromSummary ? 'summary' : 'adult'
  } else if (licensee.concession.type === CONCESSION.SENIOR) {
    result = status.fromSummary ? 'summary' : 'senior'
  } else {
    result = 'junior'
  }

  return result
}

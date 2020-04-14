import { CONCESSION } from '../../../constants.js'

export default async request => {
  const { licensee } = await request.cache().helpers.transaction.getCurrentPermission()

  let result

  if (licensee.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!licensee.concession || !licensee.concession.type || licensee.concession.type === CONCESSION.DISABLED) {
    result = 'adult'
  } else if (licensee.concession.type === CONCESSION.SENIOR) {
    result = 'senior'
  } else {
    result = 'junior'
  }

  return result
}

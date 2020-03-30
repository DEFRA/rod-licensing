import { CONCESSION } from '../../../constants.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  let result

  if (permission.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!permission.concession) {
    result = 'adult'
  } else if (permission.concession === CONCESSION.SENIOR) {
    result = 'senior'
  } else if (permission.concession === CONCESSION.JUNIOR) {
    result = 'junior'
  }

  return result
}

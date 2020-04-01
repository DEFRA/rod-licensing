import { CONCESSION } from '../../../constants.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  let result

  if (permission.noLicenceRequired) {
    result = 'noLicenceRequired'
  } else if (!permission.concession || !permission.concession.type || permission.concession.type === CONCESSION.DISABLED) {
    result = 'adult'
  } else if (permission.concession.type === CONCESSION.SENIOR) {
    result = 'senior'
  } else {
    result = 'junior'
  }

  return result
}

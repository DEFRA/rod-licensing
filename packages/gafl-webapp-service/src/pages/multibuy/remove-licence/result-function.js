import { LicencesRemaining } from '../../../constants.js'

export default async request => {
  const transaction = await request.cache().helpers.transaction.get()

  const permissions = transaction.permissions.length

  if (permissions > 0) {
    return LicencesRemaining.YES
  } else {
    return LicencesRemaining.NO
  }
}

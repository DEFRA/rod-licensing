import { CommonResults } from '../../../constants.js'
import { hasJunior } from '../../../processors/concession-helper.js'

export const licenceTypeResults = {
  ASK_LICENCE_LENGTH: 'ask-length',
  SKIP_LICENCE_LENGTH: 'skip-length'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (status.fromSummary) {
    return CommonResults.SUMMARY
  }

  return hasJunior(permission) ? licenceTypeResults.SKIP_LICENCE_LENGTH : licenceTypeResults.ASK_LICENCE_LENGTH
}

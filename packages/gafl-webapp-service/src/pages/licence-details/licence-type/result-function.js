import { CommonResults } from '../../../constants.js'
import { hasJunior } from '@defra-fish/business-rules-lib'
import * as constants from '../../../processors/mapping-constants.js'

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

  // If junior or 3 rod trout and coarse then it is always a 12 month licence
  return hasJunior(permission) || (permission.licenceType === constants.LICENCE_TYPE['trout-and-coarse'] && permission.numberOfRods === '3')
    ? licenceTypeResults.SKIP_LICENCE_LENGTH
    : licenceTypeResults.ASK_LICENCE_LENGTH
}

import { hasJunior } from '../../../processors/concession-helper.js'
import * as constants from '../../../processors/mapping-constants.js'
import commonResultHandler from '../../../handlers/multibuy-amend-handler.js'
import { CommonResults } from '../../../constants.js'

export const licenceTypeResults = {
  ASK_LICENCE_LENGTH: 'ask-length',
  SKIP_LICENCE_LENGTH: 'skip-length'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const routeDirection = await commonResultHandler(request)

  if (routeDirection !== CommonResults.OK) {
    return routeDirection
  }

  // If junior or 3 rod trout and coarse then it is always a 12 month licence
  return hasJunior(permission) || (permission.licenceType === constants.LICENCE_TYPE['trout-and-coarse'] && permission.numberOfRods === '3')
    ? licenceTypeResults.SKIP_LICENCE_LENGTH
    : licenceTypeResults.ASK_LICENCE_LENGTH
}

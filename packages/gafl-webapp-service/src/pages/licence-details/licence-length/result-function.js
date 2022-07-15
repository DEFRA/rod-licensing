import { CommonResults } from '../../../constants.js'
import { licenceToStart } from '../licence-to-start/update-transaction.js'
import commonResultHandler from '../../../handlers/multibuy-amend-handler.js'

export const licenceLengthResults = { REQUIRE_TIME: 'require-time' }

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const routeDirection = await commonResultHandler(request)

  if (routeDirection !== CommonResults.OK) {
    return routeDirection
  }
  if (permission.licenceToStart === licenceToStart.AFTER_PAYMENT || permission.licenceLength === '12M') {
    return CommonResults.OK
  }
  return licenceLengthResults.REQUIRE_TIME
}

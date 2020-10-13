import { CommonResults } from '../../../constants.js'
import { licenceToStart } from '../licence-to-start/update-transaction.js'

export const licenceLengthResults = { REQUIRE_TIME: 'require-time' }

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (status.fromSummary) {
    return CommonResults.SUMMARY
  }

  if (permission.licenceToStart === licenceToStart.AFTER_PAYMENT || permission.licenceLength === '12M') {
    return CommonResults.OK
  }

  return licenceLengthResults.REQUIRE_TIME
}

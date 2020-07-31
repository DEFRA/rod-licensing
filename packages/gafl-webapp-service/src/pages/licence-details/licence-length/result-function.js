import { CommonResults } from '../../../constants.js'

export const licenceLengthResults = { REQUIRE_TIME: 'require-time' }

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (status.fromSummary) {
    return CommonResults.SUMMARY
  }

  return permission.licenceLength === '12M' ? CommonResults.OK : licenceLengthResults.REQUIRE_TIME
}

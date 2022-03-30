import { CommonResults } from '../../../constants.js'
import { CheckMultibuy } from '../../../src/handlders/multibuy-handler.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (CheckMultibuy) {
    return CommonResults.MULTIBUY
  }

  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}

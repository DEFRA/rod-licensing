import { BLUE_BADGE_CHECK } from '../../../uri.js'
import { CommonResults } from '../../../constants.js'

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_CHECK.page)

  if (payload['blue-badge-check'] === 'no') {
    return status.fromSummary ? CommonResults.SUMMARY : CommonResults.NO
  } else {
    return CommonResults.YES
  }
}

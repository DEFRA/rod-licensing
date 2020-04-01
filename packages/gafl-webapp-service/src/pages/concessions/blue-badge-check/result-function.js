import { BLUE_BADGE_CHECK } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BLUE_BADGE_CHECK.page)
  return payload['blue-badge-check']
}

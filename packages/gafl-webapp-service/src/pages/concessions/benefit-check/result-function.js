import { BENEFIT_CHECK } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BENEFIT_CHECK.page)
  return payload['benefit-check']
}

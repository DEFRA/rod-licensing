import { BENEFIT_CHECK } from '../../../constants.js'
import cacheHelper from '../../../lib/cache-helper.js'

export default async request => {
  const { payload } = (await cacheHelper.getPageData(request))[BENEFIT_CHECK.page]
  return payload['benefit-check']
}

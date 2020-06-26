import { BENEFIT_CHECK } from '../../../uri.js'
import { CommonResults } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(BENEFIT_CHECK.page)
  return payload['benefit-check'] === 'no' ? CommonResults.NO : CommonResults.YES
}

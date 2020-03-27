import { BENEFIT_CHECK } from '../../../constants.js'

export default async request => {
  const cache = await request.cache().get('page')
  const { payload } = cache[BENEFIT_CHECK.page]
  return payload['benefit-check']
}

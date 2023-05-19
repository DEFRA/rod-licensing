import { CommonResults } from '../../../constants.js'
import { ADD_LICENCE } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(ADD_LICENCE.page)

  return payload['add-licence'] === CommonResults.YES ? CommonResults.YES : CommonResults.NO
}

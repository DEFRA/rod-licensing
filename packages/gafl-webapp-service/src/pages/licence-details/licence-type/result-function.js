import camelCase from 'camelcase'
import { LICENCE_TYPE } from '../../../constants.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TYPE.page)
  const status = await request.cache().helpers.status.getCurrentPermission()
  return status.fromSummary ? 'summary' : camelCase(payload['licence-type'])
}

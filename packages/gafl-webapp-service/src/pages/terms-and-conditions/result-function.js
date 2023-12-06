import { CommonResults } from '../../constants.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (process.env.SHOW_RECURRING_PAYMENTS?.toLowerCase() === 'true' && permission.licenceLength === '12M') {
    return CommonResults.RECURRING
  }

  return CommonResults.OK
}

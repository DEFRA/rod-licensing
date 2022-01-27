import { CommonResults } from '../../constants.js'

export const buyNewLicence = {
  BUY: 'buy-licence',
  RENEW: 'renew-licence'
}

export default async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (status.buyNewLicence) {
    return buyNewLicence.RENEW
  }

  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}

import { CommonResults } from '../../../constants.js'

export default async request => {
  const permission = await request.cache().helpers.status.getCurrentPermission()

  if (!permission.referenceNumber) {
    return CommonResults.RENEWAL_ERROR
  }

  return CommonResults.OK
}

import { CommonResults } from '../../../constants.js'

export const ageConcessionResults = {
  NO_LICENCE_REQUIRED: 'no-licence-required',
  JUNIOR: 'junior',
  SENIOR: 'senior',
  ADULT: 'adult'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (permission.licensee.noLicenceRequired) {
    return ageConcessionResults.NO_LICENCE_REQUIRED
  }

  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}

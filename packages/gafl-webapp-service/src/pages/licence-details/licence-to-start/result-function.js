import { CommonResults } from '../../../constants.js'
import { ageConcessionResults } from '../../concessions/date-of-birth/result-function.js'

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (permission.licensee.noLicenceRequired) {
    return ageConcessionResults.NO_LICENCE_REQUIRED
  }

  return status.fromSummary ? CommonResults.SUMMARY : CommonResults.OK
}

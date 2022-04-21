import commonResultHandler from '../../../handlers/multibuy-amend-handler.js'

export const ageConcessionResults = {
  NO_LICENCE_REQUIRED: 'no-licence-required',
  JUNIOR: 'junior',
  SENIOR: 'senior',
  ADULT: 'adult'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const routeDirection = commonResultHandler(request)

  if (permission.licensee.noLicenceRequired) {
    return ageConcessionResults.NO_LICENCE_REQUIRED
  }

  return routeDirection
}

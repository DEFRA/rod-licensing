import commonResultHandler from '../../../handlers/multibuy-amend-handler.js'
import { ageConcessionResults } from '../../concessions/date-of-birth/result-function.js'
import { licenceToStart } from './update-transaction.js'
import { isMultibuyForYou } from '../../../handlers/multibuy-for-you-handler.js'

export const licenceToStartResults = {
  AND_START_TIME: 'and-start-time'
}

export default async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const checkIsMultibuyForYou = await isMultibuyForYou(request)

  if (checkIsMultibuyForYou === false && permission.licensee.noLicenceRequired) {
    return ageConcessionResults.NO_LICENCE_REQUIRED
  }

  // If we already know its a 1 or 8 day licence then always jump to the time-of-day
  if (permission.licenceToStart === licenceToStart.ANOTHER_DATE && permission.licenceLength && permission.licenceLength !== '12M') {
    return licenceToStartResults.AND_START_TIME
  }

  return commonResultHandler(request)
}

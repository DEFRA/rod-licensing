import { LICENCE_TO_START } from '../../../uri.js'
import { CommonResults } from '../../../constants.js'

export const licenceToStartResults = {
  AFTER_PAYMENT: 'after-payment',
  ANOTHER_DATE_OR_TIME: 'another-date-or-time'
}

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TO_START.page)
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (payload['licence-to-start'] === 'after-payment') {
    result = status.fromSummary ? CommonResults.SUMMARY : licenceToStartResults.AFTER_PAYMENT
  } else {
    result = licenceToStartResults.ANOTHER_DATE_OR_TIME
  }

  return result
}

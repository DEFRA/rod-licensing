import { LICENCE_TO_START } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(LICENCE_TO_START.page)
  const status = await request.cache().helpers.status.getCurrentPermission()

  let result

  if (payload['licence-to-start'] === 'after-payment') {
    result = status.fromSummary ? 'summary' : 'afterPayment'
  } else {
    result = 'anotherDateOrTime'
  }

  return result
}

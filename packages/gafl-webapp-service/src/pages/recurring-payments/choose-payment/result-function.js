import { CommonResults } from '../../../constants.js'
import { CHOOSE_PAYMENT } from '../../../uri.js'

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(CHOOSE_PAYMENT.page)

  if (payload['recurring-payment'] === 'yes') {
    return CommonResults.RECURRING
  }

  return CommonResults.OK
}

import { AGREED } from '../uri.js'
import db from 'debug'
const debug = db('webapp:payment-processors')

/**
 * Create the payload for the payment creation post request
 * @param transaction
 * @param request
 * @returns {{reference: *, delayed_capture: boolean, amount: number, return_url: string, description: string}}
 */
export const preparePayment = (request, transaction) => {
  const url = new URL(AGREED.uri, `${process.env.GOV_PAY_HTTPS_REDIRECT === 'true' ? 'https' : 'http'}:${request.info.host}`)

  const result = {
    return_url: url.href,
    amount: transaction.cost * 100,
    reference: transaction.id,
    description: transaction.permissions.length === 1 ? transaction.permissions[0].permit.description : 'Multiple permits',
    delayed_capture: false
  }

  if (transaction.permissions.length === 1) {
    result.email = transaction.permissions[0].licensee.email
    result.prefilled_cardholder_details = {
      cardholder_name: `${transaction.permissions[0].licensee.firstName} ${transaction.permissions[0].licensee.lastName}`,
      billing_address: {
        line1: `${transaction.permissions[0].licensee.premises} ${transaction.permissions[0].licensee.street}`,
        postcode: transaction.permissions[0].licensee.postcode,
        city: transaction.permissions[0].licensee.town,
        country: transaction.permissions[0].licensee.countryCode
      }
    }
    if (transaction.permissions[0].licensee.locality) {
      result.prefilled_cardholder_details.billing_address.line2 = transaction.permissions[0].licensee.locality
    }
  }

  debug('Creating prepared payment %O', result)
  return result
}

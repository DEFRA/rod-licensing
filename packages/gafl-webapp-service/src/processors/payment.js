import { AGREED } from '../uri.js'
import db from 'debug'
import { licenceTypeAndLengthDisplay } from './licence-type-display.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'
const debug = db('webapp:payment-processors')

/**
 * Only include street if a value is provided
 * @param {Object} licensee
 * @returns {String}
 */
const getAddressLine1 = licensee => (licensee.street ? `${licensee.premises} ${licensee.street}` : `${licensee.premises}`)

/**
 * Create the payload for the payment creation post request
 * @param transaction
 * @param request
 * @returns {{reference: *, delayed_capture: boolean, amount: number, return_url: string, description: string}}
 */
export const preparePayment = (request, transaction) => {
  const uri = addLanguageCodeToUri(request, AGREED.uri)
  const url = new URL(uri, `${request.headers['x-forwarded-proto'] || request.server.info.protocol}:${request.info.host}`)

  const result = {
    return_url: url.href,
    amount: transaction.cost * 100,
    reference: transaction.id,
    description:
      transaction.permissions.length === 1
        ? licenceTypeAndLengthDisplay(transaction.permissions[0], request.i18n.getCatalog())
        : 'Multiple permits',
    delayed_capture: false,
    moto: process.env.CHANNEL === 'telesales',
    language: /\?.*lang=cy.*$/.test(url.search) ? 'cy' : 'en'
  }

  if (transaction.permissions.length === 1 && transaction.permissions[0].isLicenceForYou) {
    result.email = transaction.permissions[0].licensee.email
    result.prefilled_cardholder_details = {
      cardholder_name: `${transaction.permissions[0].licensee.firstName} ${transaction.permissions[0].licensee.lastName}`,
      billing_address: {
        line1: getAddressLine1(transaction.permissions[0].licensee),
        postcode: transaction.permissions[0].licensee.postcode,
        city: transaction.permissions[0].licensee.town,
        country: transaction.permissions[0].licensee.countryCode
      }
    }
    if (transaction.permissions[0].licensee.locality) {
      result.prefilled_cardholder_details.billing_address.line2 = transaction.permissions[0].licensee.locality
    }
  }

  debug('Creating prepared payment %o', result)
  return result
}

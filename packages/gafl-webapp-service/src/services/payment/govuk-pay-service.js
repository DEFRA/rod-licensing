/**
 * Interface to the GOV.UK Pay API
 */

import { PAYMENT_COMPLETION } from '../../constants.js'

const preparePayment = async (request, transaction) => {
  console.log(JSON.stringify(transaction, null, 4))
}

const createPaymentRequest = (request, transaction) => {
  const result = {
    return_url: new URL(
      PAYMENT_COMPLETION.uri,
      `${process.env.GOV_PAY_HTTPS_REDIRECT === 'true' ? 'https' : 'http'}:\\${request.info.host}`
    ).href,
    amount: transaction.cost * 100,
    reference: transaction.id,
    description: transaction.permissions.length === 1 ? transaction.permissions[0].permit.description : 'Multiple permits',
    delayed_capture: false
  }

  if (transaction.permissions.length === 1) {
    result.email = transaction.permissions[0].licensee.email
    result.cardholder_name = `${transaction.permissions[0].licensee.firstName} ${transaction.permissions[0].licensee.lastName}`
    result.billing_address = {
      line1: transaction.permissions[0].licensee.premises + ' ' + transaction.permissions[0].licensee.street,
      line2: transaction.permissions[0].licensee.locality,
      postcode: transaction.permissions[0].licensee.postcode,
      city: transaction.permissions[0].licensee.town,
      country: transaction.permissions[0].licensee.country
    }
  }

  return result
}

/*
result.language = 'en'
  result.delayed_capture = false
  result.email = holder.contact.email

  result.prefilled_cardholder_details = {
    cardholder_name: holder.name.firstName + ' ' + holder.name.lastName,
    billing_address: {
      line1: holder.address.premises + ' ' + holder.address.street,
      line2: holder.address.locality,
      postcode: holder.address.postcode,
      city: holder.address.town,
      country: holder.address.country
    }
  }
 */
//   const result = {}
//   const session = request.sessionCache
//   const permit = session.transaction.permit
//   const holder = session.buy.holder
//
//   result.return_url = url.format({
//     protocol: govPayConfig.httpsRedirect ? 'https' : 'http',
//     host: request.info.host,
//     pathname: 'govpay/complete'
//   })
//
//   result.amount = permit.cost * 100
//   result.reference = Uuid()
//   result.description = permit.description
//   result.language = 'en'
//   result.delayed_capture = false
//   result.email = holder.contact.email
//
//   result.prefilled_cardholder_details = {
//     cardholder_name: holder.name.firstName + ' ' + holder.name.lastName,
//     billing_address: {
//       line1: holder.address.premises + ' ' + holder.address.street,
//       line2: holder.address.locality,
//       postcode: holder.address.postcode,
//       city: holder.address.town,
//       country: holder.address.country
//     }
//   }
//
//   return result
// }

export { preparePayment, createPaymentRequest }

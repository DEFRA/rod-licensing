import { govUkPayApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('sales:recurring')

export const getRecurringPaymentAgreement = async agreementId => {
  const response = await govUkPayApi.getRecurringPaymentAgreementInformation(agreementId)
  if (response.ok) {
    const resBody = await response.json()
    const resBodyNoCardDetails = structuredClone(resBody)

    if (resBodyNoCardDetails.payment_instrument?.card_details) {
      delete resBodyNoCardDetails.payment_instrument.card_details
    }
    debug('Successfully got recurring payment agreement information: %o', resBodyNoCardDetails)
    return resBody
  } else {
    throw new Error('Failure getting agreement in the GOV.UK API service')
  }
}

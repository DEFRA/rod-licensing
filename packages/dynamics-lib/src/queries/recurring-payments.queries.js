import { RecurringPayment } from '../entities/recurring-payment.entity.js'
import { PredefinedQuery } from './predefined-query.js'

/**
 * Builds a query to retrieve active recurring payment and related entities for a given date
 *
 * @param date current date used for lookup
 * @returns {PredefinedQuery}
 */
export const findDueRecurringPayments = date => {
  const { contact, activePermission } = RecurringPayment.definition.relationships

  const filter = `defra_nextduedate eq '${date}' and defra_cancelleddate eq null`

  return new PredefinedQuery({
    root: RecurringPayment,
    filter: filter,
    expand: [contact, activePermission]
  })
}
/**
 * Builds a query to retrieve recurring payments by agreementId
 *
 * @param agreementId the agreementId assigned by GOV.UK Pay
 * @returns {PredefinedQuery}
 */
export const findRecurringPaymentsByAgreementId = agreementId => {
  const filter = `defra_agreementId eq '${agreementId}'`

  return new PredefinedQuery({
    root: RecurringPayment,
    filter: filter
  })
}

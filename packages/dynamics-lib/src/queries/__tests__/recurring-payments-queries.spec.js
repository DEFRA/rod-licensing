import { findDueRecurringPayments, findRecurringPaymentsByAgreementId } from '../recurring-payments.queries.js'

describe('Recurring Payment Queries', () => {
  describe('findDueRecurringPayments', () => {
    it('builds a query to retrieve active recurring payments', () => {
      const date = new Date('2023-11-08')

      const query = findDueRecurringPayments(date)

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter:
          "defra_nextduedate eq 'Wed Nov 08 2023 00:00:00 GMT+0000 (Greenwich Mean Time)' and defra_cancelleddate eq null and _defra_nextrecurringpayment_value eq null and statecode eq 0",
        select: [
          'defra_recurringpaymentid',
          'defra_name',
          'statecode',
          'defra_nextduedate',
          'defra_cancelleddate',
          'defra_cancelledreason',
          'defra_enddate',
          'defra_agreementid',
          'defra_publicid',
          'defra_lastdigitscardnumbers'
        ],
        expand: [{ property: 'defra_Contact' }, { property: 'defra_ActivePermission' }]
      })
    })
  })

  describe('findRecurringPaymentsByAgreementId', () => {
    it('builds a query to retrieve active recurring payments', () => {
      const agreementId = 'abc123'

      const query = findRecurringPaymentsByAgreementId(agreementId)

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter: `defra_agreementid eq '${agreementId}' and statecode eq 0`,
        select: [
          'defra_recurringpaymentid',
          'defra_name',
          'statecode',
          'defra_nextduedate',
          'defra_cancelleddate',
          'defra_cancelledreason',
          'defra_enddate',
          'defra_agreementid',
          'defra_publicid',
          'defra_lastdigitscardnumbers'
        ]
      })
    })
  })
})

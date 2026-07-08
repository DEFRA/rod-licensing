import {
  findDueRecurringPayments,
  findRecurringPaymentsByAgreementId,
  findRecurringPaymentByPermissionId,
  findPermissionByRecurringPaymentId
} from '../recurring-payments.queries.js'
import { RecurringPayment } from '../../entities/recurring-payment.entity.js'

describe('Recurring Payment Queries', () => {
  const baseSelection = () => [
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

  describe('findDueRecurringPayments', () => {
    it('builds a query to retrieve active recurring payments', () => {
      const date = new Date('2023-11-08')

      const query = findDueRecurringPayments(date)

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter:
          "defra_nextduedate eq 'Wed Nov 08 2023 00:00:00 GMT+0000 (Greenwich Mean Time)' and defra_cancelleddate eq null and _defra_nextrecurringpayment_value eq null and statecode eq 0",
        select: baseSelection(),
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
        select: baseSelection()
      })
    })
  })

  describe('findRecurringPaymentByPermissionId', () => {
    it('builds a query to retrieve recurring payments by permissionId', () => {
      const permissionId = 'perm-123'

      const query = findRecurringPaymentByPermissionId(permissionId)

      expect(query.toRetrieveRequest()).toEqual({
        collection: 'defra_recurringpayments',
        filter: `_defra_activepermission_value eq ${permissionId} and statecode eq 0`,
        select: baseSelection(),
        expand: [{ property: 'defra_ActivePermission' }]
      })
    })
  })

  describe('findPermissionByRecurringPaymentId', () => {
    it.each(['rcp-456', 'rcp-789'])('builds full filter with conjunctions when recurring payment id is %s', recurringPaymentId => {
      const mockDefaultFilter = 'mock_default_filter'
      const defaultFilterSpy = jest.spyOn(RecurringPayment.definition, 'defaultFilter', 'get').mockReturnValue(mockDefaultFilter)

      try {
        const request = findPermissionByRecurringPaymentId(recurringPaymentId).toRetrieveRequest()
        expect(request.filter).toBe(
          `_defra_activepermission_value ne null and defra_recurringpaymentid eq ${recurringPaymentId} and ${mockDefaultFilter}`
        )
      } finally {
        defaultFilterSpy.mockRestore()
      }
    })

    it('expands active permission relationship', () => {
      const request = findPermissionByRecurringPaymentId('rcp-456').toRetrieveRequest()
      expect(request.expand).toContainEqual({ property: 'defra_ActivePermission' })
    })
  })
})

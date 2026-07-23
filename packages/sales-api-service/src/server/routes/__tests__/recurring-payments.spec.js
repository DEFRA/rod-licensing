import recurringPayments from '../recurring-payments.js'
import {
  getRecurringPayments,
  processRPResult,
  cancelRecurringPayment,
  preparePermissionDataForRcpCancellation
} from '../../../services/recurring-payments.service.js'
import {
  dueRecurringPaymentsRequestParamsSchema,
  processRPResultRequestParamsSchema,
  cancelRecurringPaymentRequestParamsSchema,
  cancelRecurringPaymentRequestQuerySchema
} from '../../../schema/recurring-payments.schema.js'
import { permissionRenewalDataRequestParamsSchema } from '../../../schema/renewals.schema.js'
import { executeQuery, permissionForFullReferenceNumber } from '@defra-fish/dynamics-lib'
import {
  MOCK_EXISTING_PERMISSION_ENTITY,
  MOCK_EXISTING_CONTACT_ENTITY,
  MOCK_1DAY_SENIOR_PERMIT_ENTITY,
  MOCK_CONCESSION_PROOF_ENTITY,
  MOCK_CONCESSION
} from '../../../__mocks__/test-data.js'

const [
  {
    options: { handler: drpHandler }
  },
  {
    options: { handler: prpHandler }
  },
  {
    options: { handler: crpHandler }
  },
  {
    options: { handler: prcpHandler }
  }
] = recurringPayments

jest.mock('../../../services/recurring-payments.service.js', () => ({
  getRecurringPayments: jest.fn(),
  processRPResult: jest.fn(),
  cancelRecurringPayment: jest.fn(),
  preparePermissionDataForRcpCancellation: jest.fn()
}))

jest.mock('@defra-fish/dynamics-lib', () => ({
  ...jest.requireActual('@defra-fish/dynamics-lib'),
  permissionForFullReferenceNumber: jest.fn(),
  executeQuery: jest.fn()
}))

jest.mock('../../../schema/recurring-payments.schema.js', () => ({
  dueRecurringPaymentsRequestParamsSchema: jest.fn(),
  processRPResultRequestParamsSchema: jest.fn(),
  cancelRecurringPaymentRequestParamsSchema: jest.fn()
}))

const getMockRequest = ({
  date = '2023-10-19',
  transactionId = 'transaction-id',
  paymentId = 'payment-id',
  createdDate = 'created-date',
  existingRecurringPaymentId = 'existing-recurring-payment-id',
  agreementId = 'agreement-id',
  id = 'abc123',
  reason = 'Payment Failure'
}) => ({
  params: { date, transactionId, paymentId, createdDate, existingRecurringPaymentId, agreementId, id },
  query: { reason }
})

const getMockResponseToolkit = () => ({
  response: jest.fn()
})

const permissionForFullReferenceNumberMock = () => ({
  entity: MOCK_EXISTING_PERMISSION_ENTITY,
  expanded: {
    licensee: { entity: MOCK_EXISTING_CONTACT_ENTITY, expanded: {} },
    concessionProofs: [{ entity: MOCK_CONCESSION_PROOF_ENTITY, expanded: { concession: { entity: MOCK_CONCESSION } } }],
    permit: { entity: MOCK_1DAY_SENIOR_PERMIT_ENTITY, expanded: {} }
  }
})

describe('recurring payments', () => {
  beforeEach(jest.clearAllMocks)

  describe('dueRecurringPayments', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await drpHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call getRecurringPayments with date', async () => {
      const date = Symbol('date')
      const request = getMockRequest({ date })
      await drpHandler(request, getMockResponseToolkit())
      expect(getRecurringPayments).toHaveBeenCalledWith(date)
    })

    it('should validate with dueRecurringPaymentsRequestParamsSchema', async () => {
      const date = Symbol('date')
      const request = getMockRequest({ date })
      await drpHandler(request, getMockResponseToolkit())
      expect(recurringPayments[0].options.validate.params).toBe(dueRecurringPaymentsRequestParamsSchema)
    })
  })

  describe('processRPResult', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await prpHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call processRPResult with transaction id, payment id and createdDate', async () => {
      const transactionId = Symbol('transaction-id')
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      const request = getMockRequest({ transactionId, paymentId, createdDate })
      await prpHandler(request, getMockResponseToolkit())
      expect(processRPResult).toHaveBeenCalledWith(transactionId, paymentId, createdDate)
    })

    it('should validate with processRPResultRequestParamsSchema', async () => {
      const transactionId = Symbol('transaction-id')
      const paymentId = Symbol('payment-id')
      const createdDate = Symbol('created-date')
      const request = getMockRequest({ transactionId, paymentId, createdDate })
      await prpHandler(request, getMockResponseToolkit())
      expect(recurringPayments[1].options.validate.params).toBe(processRPResultRequestParamsSchema)
    })
  })

  describe('cancelRecurringPayment', () => {
    it('handler should return continue response', async () => {
      const request = getMockRequest({})
      const responseToolkit = getMockResponseToolkit()
      expect(await crpHandler(request, responseToolkit)).toEqual(responseToolkit.continue)
    })

    it('should call cancelRecurringPayment with id and reason', async () => {
      const id = Symbol('recurring-payment-id')
      const reason = Symbol('recurring-payment-reason')
      const request = getMockRequest({ id, reason })
      await crpHandler(request, getMockResponseToolkit())
      expect(cancelRecurringPayment).toHaveBeenCalledWith(id, reason)
    })

    it('should validate id with cancelRecurringPaymentRequestParamsSchema', async () => {
      const request = getMockRequest({})
      await crpHandler(request, getMockResponseToolkit())
      expect(recurringPayments[2].options.validate.params).toBe(cancelRecurringPaymentRequestParamsSchema)
    })

    it('should validate reason with cancelRecurringPaymentRequestQuerySchema', async () => {
      const request = getMockRequest({})
      await crpHandler(request, getMockResponseToolkit())
      expect(recurringPayments[2].options.validate.query).toBe(cancelRecurringPaymentRequestQuerySchema)
    })
  })

  describe('permissionRcpCancellationData', () => {
    it('should call permissionForFullReferenceNumber with reference number', async () => {
      executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])
      preparePermissionDataForRcpCancellation.mockResolvedValueOnce({ id: 'prepared-permission' })
      const request = getMockRequest({})
      request.params.referenceNumber = 'REFERENCE123'

      await prcpHandler(request, getMockResponseToolkit())

      expect(permissionForFullReferenceNumber).toHaveBeenCalledWith('REFERENCE123')
    })

    it('should call preparePermissionDataForRcpCancellation with expected data', async () => {
      executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])
      preparePermissionDataForRcpCancellation.mockResolvedValueOnce({ id: 'prepared-permission' })

      const request = getMockRequest({})
      request.params.referenceNumber = 'ABC123'
      await prcpHandler(request, getMockResponseToolkit())

      expect(preparePermissionDataForRcpCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          ...MOCK_EXISTING_PERMISSION_ENTITY.toJSON(),
          licensee: MOCK_EXISTING_CONTACT_ENTITY.toJSON(),
          permit: MOCK_1DAY_SENIOR_PERMIT_ENTITY.toJSON()
        })
      )
    })

    it('should return wrapped prepared permission', async () => {
      executeQuery.mockResolvedValueOnce([permissionForFullReferenceNumberMock()])
      preparePermissionDataForRcpCancellation.mockResolvedValueOnce({ id: 'prepared-permission' })
      const responseToolkit = getMockResponseToolkit()

      const request = getMockRequest({})
      request.params.referenceNumber = 'ABC123'
      await prcpHandler(request, responseToolkit)

      expect(responseToolkit.response).toHaveBeenCalledWith({ permission: { id: 'prepared-permission' } })
    })

    it('should validate with permissionRenewalDataRequestParamsSchema', async () => {
      expect(recurringPayments[3].options.validate.params).toBe(permissionRenewalDataRequestParamsSchema)
    })
  })
})

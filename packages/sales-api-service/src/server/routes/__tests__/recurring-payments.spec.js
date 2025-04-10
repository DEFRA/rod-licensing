import recurringPayments from '../recurring-payments.js'
import { getRecurringPayments, processRPResult } from '../../../services/recurring-payments.service.js'

const [
  {
    options: { handler: drpHandler }
  },
  {
    options: { handler: prpHandler }
  }
] = recurringPayments

jest.mock('../../../services/recurring-payments.service.js', () => ({
  getRecurringPayments: jest.fn(),
  processRPResult: jest.fn()
}))

const getMockRequest = ({
  date = '2023-10-19',
  transactionId = 'transaction-id',
  paymentId = 'payment-id',
  createdDate = 'created-date'
}) => ({
  params: { date, transactionId, paymentId, createdDate }
})

const getMockResponseToolkit = () => ({
  response: jest.fn()
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
  })
})

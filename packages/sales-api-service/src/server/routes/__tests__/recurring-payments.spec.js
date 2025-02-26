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

const getMockRequest = ({ date = '2023-10-19', id = 'transaction' }) => ({
  params: { date, id }
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
    it('should call processRPResult with transaction id', async () => {
      const id = Symbol('transaction')
      const request = getMockRequest({ id })
      await prpHandler(request)
      expect(processRPResult).toHaveBeenCalledWith(id)
    })
  })
})

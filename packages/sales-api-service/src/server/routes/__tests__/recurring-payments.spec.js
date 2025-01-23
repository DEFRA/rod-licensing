import dueRecurringPayments from '../recurring-payments.js'
import { getRecurringPayments } from '../../../services/recurring-payments.service.js'

const [
  {
    options: { handler: drpHandler }
  }
] = dueRecurringPayments

jest.mock('../../../services/recurring-payments.service.js', () => ({
  getRecurringPayments: jest.fn()
}))

const getMockRequest = ({ date = '2023-10-19' }) => ({
  params: { date }
})

const getMockResponseToolkit = () => ({
  response: jest.fn()
})

describe('recurring payments', () => {
  beforeEach(jest.clearAllMocks)

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

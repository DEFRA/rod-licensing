import dueRecurringPayments from '../recurring-payments.js'
import { getRecurringPayments, processRecurringPayment } from '../../../services/recurring-payments.service.js'
import { preparePayment } from '../../../../../gafl-webapp-service/src/processors/payment.js'
import { sendPayment } from '../../../../../gafl-webapp-service/src/services/payment/govuk-pay-service.js'

jest.mock('../../../services/recurring-payments.service.js', () => ({
  getRecurringPayments: jest.fn(),
  processRecurringPayment: jest.fn()
}))

jest.mock('../../../../../gafl-webapp-service/src/processors/payment.js', () => ({
  preparePayment: jest.fn()
}))

jest.mock('../../../../../gafl-webapp-service/src/services/payment/govuk-pay-service.js', () => ({
  sendPayment: jest.fn()
}))

const getMockRequest = ({ transactionRecord = {}, contact = {}, date = '2023-10-19' } = {}) => ({
  payload: { transactionRecord, contact },
  params: { date }
})

const getMockResponseToolkit = () => {
  const code = jest.fn()
  const response = jest.fn().mockReturnValue({ code })
  return { response }
}

describe('recurring payments', () => {
  beforeEach(jest.clearAllMocks)

  it('handler should return the response from getRecurringPayments', async () => {
    const date = '2023-10-19'
    const mockResponseData = { some: 'data' }

    getRecurringPayments.mockResolvedValue(mockResponseData)

    const request = getMockRequest({ date })
    const responseToolkit = getMockResponseToolkit()

    await dueRecurringPayments[0].handler(request, responseToolkit)

    expect(responseToolkit.response).toHaveBeenCalledWith(mockResponseData)
  })

  it('should call getRecurringPayments with date', async () => {
    const date = Symbol('date')
    const request = getMockRequest({ date })
    const responseToolkit = getMockResponseToolkit()

    await dueRecurringPayments[0].handler(request, responseToolkit)

    expect(getRecurringPayments).toHaveBeenCalledWith(date)
  })
})

describe('POST /processRecurringPayment', () => {
  it('should return 404 if no recurringPayment is found', async () => {
    processRecurringPayment.mockResolvedValue({ recurringPayment: null })

    const request = getMockRequest()
    const responseToolkit = getMockResponseToolkit()

    await dueRecurringPayments[1].handler(request, responseToolkit)

    expect(processRecurringPayment).toHaveBeenCalledWith(request.payload.transactionRecord, request.payload.contact)

    expect(responseToolkit.response).toHaveBeenCalledWith({ error: 'No recurring payment found' })
    expect(responseToolkit.response().code).toHaveBeenCalledWith(404)
  })

  it('should process payment and return response', async () => {
    const recurringPayment = { id: 'test-recurring-payment' }
    const preparedPayment = { id: 'test-prepared-payment' }
    const paymentResponse = { id: 'test-payment-response' }

    processRecurringPayment.mockResolvedValue({ recurringPayment })
    preparePayment.mockReturnValue(preparedPayment)
    sendPayment.mockResolvedValue(paymentResponse)

    const request = getMockRequest()
    const responseToolkit = getMockResponseToolkit()

    await dueRecurringPayments[1].handler(request, responseToolkit)

    expect(processRecurringPayment).toHaveBeenCalledWith(request.payload.transactionRecord, request.payload.contact)
    expect(preparePayment).toHaveBeenCalledWith(request, recurringPayment)
    expect(sendPayment).toHaveBeenCalledWith(preparedPayment)

    expect(responseToolkit.response).toHaveBeenCalledWith(paymentResponse)
  })

  it('should return 500 if an error occurs', async () => {
    const error = new Error('Test error')
    processRecurringPayment.mockRejectedValue(error)

    const request = getMockRequest()
    const responseToolkit = getMockResponseToolkit()

    await dueRecurringPayments[1].handler(request, responseToolkit)

    expect(responseToolkit.response).toHaveBeenCalledWith({ error: 'Failed to process recurring payment' })
    expect(responseToolkit.response().code).toHaveBeenCalledWith(500)
  })
})

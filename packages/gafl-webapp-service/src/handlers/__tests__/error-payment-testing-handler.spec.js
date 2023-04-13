import errorPaymentTestingHandler from '../error-payment-testing-handler.js'

describe('Error payment testing handler', () => {
  it.each([['pre-payment'], ['post-payment']])('throws error', async origin => {
    const mockRequest = {
      query: { origin }
    }
    const mockH = {}

    await expect(errorPaymentTestingHandler(mockRequest, mockH)).rejects.toThrow()
  })
})

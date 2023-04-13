import errorPaymentTestRoutes from '../error-payment-test-routes.js'

describe('Error payment test route handler', () => {
  describe('error route', () => {
    it('has a return value with a method of GET and path of /buy/payment-error', async () => {
      expect(errorPaymentTestRoutes).toMatchSnapshot()
    })
  })

  describe('ERROR_TESTING handler', () => {
    const errorTesting = errorPaymentTestRoutes[0].handler

    it.each([['pre-payment'], ['post-payment']])('throws error', async origin => {
      const mockRequest = {
        query: { origin }
      }
      const mockH = {}

      await expect(errorTesting(mockRequest, mockH)).rejects.toThrow()
    })
  })
})

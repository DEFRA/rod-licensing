import errorTestRoutes from '../error-test-routes'

describe('Error test route handler', () => {
  describe('error route', () => {
    it('has a return value with a method of GET and path of /buy/throw-error', async () => {
      expect(errorTestRoutes).toMatchSnapshot()
    })
  })

  describe('ERROR_TESTING handler', () => {
    const errorTesting = errorTestRoutes[0].handler

    it.each([
      ['401', 'Unauthorized'],
      ['403', 'Forbidden'],
      ['500', 'Internal Server Error']
    ])('throws the correct error when given %s as the param', async (code, message) => {
      const mockRequest = {
        query: { error: code }
      }
      const mockH = {}

      await expect(errorTesting(mockRequest, mockH)).rejects.toThrow(message)
    })
  })
})

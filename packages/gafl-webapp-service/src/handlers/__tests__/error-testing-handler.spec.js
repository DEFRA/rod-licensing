import errorTestingHandler from '../error-testing-handler.js'

describe('Error testing handler', () => {
  it.each([
    ['401', 'Unauthorized'],
    ['403', 'Forbidden'],
    ['500', 'Internal Server Error']
  ])('throws the correct error when given %s as the param', async (code, message) => {
    const mockRequest = {
      query: { error: code }
    }
    const mockH = {}

    await expect(errorTestingHandler(mockRequest, mockH)).rejects.toThrow(message)
  })
})

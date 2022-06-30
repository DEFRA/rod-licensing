import resultFunction from '../result-function'

describe('disability > result-function', () => {
  describe('default', () => {
    const mockStatusCacheGet = jest.fn()
    const mockRequest = {
      cache: () => ({
        helpers: {
          status: {
            getCurrentPermission: mockStatusCacheGet
          }
        }
      })
    }
    it('should return no-licence-required if the licensee does not require a licence', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({}))
      const result = await resultFunction(mockRequest)
      expect(result).toBe('ok')
    })

    it('should return no-licence-required if the licensee does not require a licence', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromSummary: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe('summary')
    })

    it('should return no-licence-required if the licensee does not require a licence', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: true }))
      const result = await resultFunction(mockRequest)
      expect(result).toBe('amend')
    })
  })
})

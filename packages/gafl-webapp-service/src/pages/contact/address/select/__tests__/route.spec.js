import { getData } from '../route'

describe('address-select > route', () => {
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        addressLookup: {
          getCurrentPermission: jest.fn(() => ({}))
        }
      }
    })
  }

  describe('getData', () => {
    it('should return pronoun as your, if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('your')
    })

    it('should return pronoun as their, if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toBe('their')
    })
  })
})

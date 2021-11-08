import { getData } from '../route'

describe('name > route', () => {
  const mockStatusCacheGet = jest.fn()
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: mockStatusCacheGet
        },
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })
  }

  describe('getData', () => {
    it('should return pronoun as your and you, if isLicenceForYou is true on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [] }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toStrictEqual({ possessive: 'your', personal: 'you' })
    })

    it('should return pronoun as their and they, if isLicenceForYou is false on the status cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ concessions: [] }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.pronoun).toStrictEqual({ possessive: 'their', personal: 'they' })
    })
  })
})

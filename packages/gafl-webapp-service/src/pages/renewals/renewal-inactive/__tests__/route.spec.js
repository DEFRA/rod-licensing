import { getData } from '../route'
import { NEW_TRANSACTION } from '../../../../uri.js'

describe('renewal-inactive > route', () => {
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
  describe('getData', () => {
    it('should return the reference number', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ referenceNumber: '00000000-2WC3FDR-CD379B', authentication: {} }))
      const result = await getData(mockRequest)
      expect(result.referenceNumber).toBe('00000000-2WC3FDR-CD379B')
    })

    it('should return the reason the renewal is inactive', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { reason: 'not-due' } }))
      const result = await getData(mockRequest)
      expect(result.reason).toBe('not-due')
    })

    it('should return the date the renewal is valid to', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: { endDate: '2020-12-13T23:59:59Z' } }))
      const result = await getData(mockRequest)
      expect(result.validTo).toBe('13 December 2020')
    })

    it('should return the new transation uri', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ authentication: {} }))
      const result = await getData(mockRequest)
      expect(result.uri.new).toBe(NEW_TRANSACTION.uri)
    })
  })
})

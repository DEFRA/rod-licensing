import { getData } from '../route'
import { getPronoun } from '../../../../processors/licence-type-display.js'

jest.mock('../../../../processors/licence-type-display.js')

describe('name > route', () => {
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
    it('should return isLicenceForYou as true if isLicenceForYou is true on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false if isLicenceForYou is false on the status cache', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('should call getPronoun', async () => {
      mockStatusCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      await getData(mockRequest)
      expect(getPronoun).toHaveBeenCalled()
    })
  })
})

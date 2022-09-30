import { getData } from '../route'
import '../../../../processors/pricing-summary.js'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'

jest.mock('../../../../processors/pricing-summary.js')
jest.mock('../../../../processors/licence-type-display.js')

describe('licence-length > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    }),
    i18n: {
      getCatalog: () => ({})
    }
  }

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: true }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))
      const result = await getData(mockRequest)
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const sampleRequest = {
        ...mockRequest,
        i18n: {
          getCatalog: () => catalog
        }
      }
      mockTransactionCacheGet.mockImplementationOnce(() => permission)

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)
      mockTransactionCacheGet.mockImplementationOnce(() => ({ isLicenceForYou: false }))

      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(returnValue)
    })
  })
})

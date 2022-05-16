import { getData } from '../route'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../constants', () => ({
  COMPLETION_STATUS: {
    agreed: 'agreed',
    posted: 'posted',
    finalised: 'finalised'
  }
}))

describe('licence-length > route', () => {
  const mockTransactionCacheGet = jest.fn()

  const generateRequestMock = (status = {}) => ({
    cache: jest.fn(() => ({
      helpers: {
        status: {
          get: jest.fn(() => status),
          set: jest.fn()
        },
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        }
      }
    })),
    i18n: {
      getCatalog: () => ({})
    }
  })

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
    it('licenceTypeDisplay is called with the expected arguments', async () => {
      const catalog = Symbol('mock catalog')
      const permission = Symbol('mock permission')
      const sampleRequest = {
        ...mockRequest,
        i18n: {
          getCatalog: () => (catalog)
        }
      }
      mockTransactionCacheGet.mockImplementationOnce(() => permission)

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it.only('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)

      const query = {
        [COMPLETION_STATUS.agreed]: 'agreed',
        [COMPLETION_STATUS.posted]: 'posted',
        [COMPLETION_STATUS.finalised]: 'finalised'
      }
      const mockRequest = generateRequestMock(query)

      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(returnValue)
    })
  })
})

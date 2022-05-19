import { getData } from '../route'
import { licenceTypeDisplay } from '../../../../processors/licence-type-display.js'
import { COMPLETION_STATUS, CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'

jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../constants', () => ({
  COMPLETION_STATUS: {
    agreed: 'agreed',
    posted: 'posted',
    finalised: 'finalised'
  },
  CommonResults: {
    ok: 'ok'
  },
  ShowDigitalLicencePages: {
    YES: 'yes'
  }
}))

describe('licence-length > route', () => {
  const mockTransactionCacheGet = jest.fn()
  const mockStatusCacheGet = jest.fn()

  const mockRequest = {
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: mockTransactionCacheGet
        },
        status: {
          get: mockStatusCacheGet
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
      const status = {
        [COMPLETION_STATUS.agreed]: 'agreed',
        [COMPLETION_STATUS.posted]: 'posted',
        [COMPLETION_STATUS.finalised]: 'finalised',
        [CommonResults.OK]: 'ok',
        [ShowDigitalLicencePages.YES]: 'yes'
      }
      const sampleRequest = {
        ...mockRequest,
        i18n: {
          getCatalog: () => catalog
        }
      }
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      mockStatusCacheGet.mockImplementationOnce(() => status)

      await getData(sampleRequest)

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for licenceTypeStr', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)

      const permission = {
        startDate: '2021-01-01'
      }

      const status = {
        [COMPLETION_STATUS.agreed]: 'agreed',
        [COMPLETION_STATUS.posted]: 'posted',
        [COMPLETION_STATUS.finalised]: 'finalised',
        [CommonResults.OK]: 'ok',
        [ShowDigitalLicencePages.YES]: 'yes'
      }
      mockTransactionCacheGet.mockImplementationOnce(() => permission)
      mockStatusCacheGet.mockImplementationOnce(() => status)

      const result = await getData(mockRequest)
      const ret = result.licenceTypeStr

      expect(ret).toEqual(returnValue)
    })
  })
})

import { getData } from '../route'
import Boom from '@hapi/boom'
import { displayStartTime, displayEndTime } from '../../../../processors/date-and-time-display.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { COMPLETION_STATUS, CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'

jest.mock('../../../../processors/concession-helper.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../constants.js', () => ({
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
  },
  MultibuyForYou: {
    YES: 'yes',
    NO: 'no'
  }
}))

const getMockStatus = () => ({
  [COMPLETION_STATUS.agreed]: 'agreed',
  [COMPLETION_STATUS.posted]: 'posted',
  [COMPLETION_STATUS.finalised]: 'finalised',
  [CommonResults.OK]: 'ok',
  [ShowDigitalLicencePages.YES]: 'yes'
})

const getMockTransaction = () => ({
  permissions: [getMockPermission()]
})

const getMockPermission = () => ({
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela',
    obfuscatedDob: 'obfuscatedDob'
  },
  referenceNumber: '123456789',
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceLength: '8D',
  permit: { cost: 12 }
})

const getMockCatalog = overrides => ({
  age_senior_concession: Symbol('Over 65'),
  age_junior_concession: Symbol('Junior (13 to 16)'),

  licence_type_1d: Symbol('1 day'),
  licence_type_8d: Symbol('8 days'),
  licence_type_12m: Symbol('12 months'),
  ...overrides
})

describe('licence-length > route', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getData', () => {
    const getMockRequest = (statusGet = () => {}, transactionGet = () => {}, catalog = getMockCatalog()) => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => transactionGet
          },
          status: {
            get: async () => statusGet
          }
        }
      }),
      i18n: {
        getCatalog: () => catalog
      }
    })

    beforeEach(() => jest.clearAllMocks())

    it('licenceTypeDisplay is called with permissions and mssgs', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      const mssgs = mockRequest.i18n.getCatalog()
      await getData(mockRequest)
      expect(licenceTypeDisplay).toHaveBeenCalledWith(mockPermission, mssgs)
    })

    it('licenceTypeAndLengthDisplay is called with permission and mssgs', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      const mssgs = mockRequest.i18n.getCatalog()
      await getData(mockRequest)
      expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(mockPermission, mssgs)
    })

    it('displayStartTime is called request and permission', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      await getData(mockRequest)
      expect(displayStartTime).toHaveBeenCalledWith(mockRequest, mockPermission)
    })

    it('displayEndTime is called with request and permission', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      await getData(mockRequest)
      expect(displayEndTime).toHaveBeenCalledWith(mockRequest, mockPermission)
    })

    it('hasDisabled is called with permission', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      await getData(mockRequest)
      expect(concessionHelper.hasDisabled).toHaveBeenCalledWith(mockPermission)
    })

    it('getAgeConcession is called with permission', async () => {
      const mockPermission = getMockPermission()
      const mockRequest = getMockRequest(getMockStatus(), getMockTransaction(mockPermission))
      await getData(mockRequest)
      expect(concessionHelper.getAgeConcession).toHaveBeenCalledWith(mockPermission)
    })

    describe('returns expected licence data for the given permission:', () => {
      const licenceType = Symbol('Trout and coarse, up to 2 rods')
      licenceTypeDisplay.mockReturnValue(licenceType)

      const startTime = Symbol('9:32am on 23 June 2021')
      displayStartTime.mockReturnValue(startTime)

      const endTime = Symbol('9:32am on 23 June 2022')
      displayEndTime.mockReturnValue(endTime)

      const disabled = Symbol('disabled')
      concessionHelper.hasDisabled.mockReturnValue(disabled)

      it('returns expected data', async () => {
        const data = await getData(getMockRequest(getMockStatus(), getMockTransaction()))
        expect(data).toMatchSnapshot()
      })

      it.each([['1D'], ['8D'], ['12M']])('returns licence length as %s', async licenceLength => {
        licenceTypeAndLengthDisplay.mockReturnValue(licenceLength)
        const data = await getData(getMockRequest(getMockStatus(), getMockTransaction()))
        expect(data).toMatchSnapshot()
      })

      it.each([['Senior'], ['Junior'], ['Neither']])('returns age concession as %s', async type => {
        const concession = {
          type: type
        }
        concessionHelper.getAgeConcession.mockReturnValue(concession)
        const data = await getData(getMockRequest(getMockStatus(), getMockTransaction()))
        expect(data).toMatchSnapshot()
      })
    })

    describe('throws a Boom forbidden error', () => {
      it('if status agreed flag is not set', async () => {
        const status = () => ({})

        const boomError = Boom.forbidden('Attempt to access the licence information handler with no agreed flag set')

        await expect(getData(getMockRequest(status, getMockTransaction()))).rejects.toThrow(boomError)
      })

      it('if status posted flag is not set', async () => {
        const status = () => ({
          [COMPLETION_STATUS.agreed]: 'agreed'
        })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no posted flag set')
        await expect(getData(getMockRequest(status(), getMockTransaction()))).rejects.toThrow(boomError)
      })

      it('if status finalised flag is not set', async () => {
        const status = () => ({
          [COMPLETION_STATUS.agreed]: 'agreed',
          [COMPLETION_STATUS.posted]: 'posted'
        })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no finalised flag set')
        await expect(getData(getMockRequest(status(), getMockTransaction()))).rejects.toThrow(boomError)
      })
    })
  })
})

import { getData } from '../route'
import Boom from '@hapi/boom'
import { displayStartTime, displayEndTime } from '../../../../processors/date-and-time-display.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { COMPLETION_STATUS, CommonResults, ShowDigitalLicencePages } from '../../../../constants.js'
import * as concessionHelper from '../../../../processors/concession-helper.js'

jest.mock('../../../../processors/concession-helper.js')
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
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
  },
  MultibuyForYou: {
    YES: 'yes',
    NO: 'no'
  }
}))

const status = () => ({
  [COMPLETION_STATUS.agreed]: 'agreed',
  [COMPLETION_STATUS.posted]: 'posted',
  [COMPLETION_STATUS.finalised]: 'finalised',
  [CommonResults.OK]: 'ok',
  [ShowDigitalLicencePages.YES]: 'yes'
})

const transaction = () => ({
  permissions: [permission]
})

const permission = {
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
}

const catalog = Symbol('mock catalog')

describe('licence-length > route', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getData', () => {
    const getMockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: transactionGet
          },
          status: {
            get: statusGet
          }
        }
      }),
      i18n: {
        getCatalog: () => catalog
      }
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      await getData(getMockRequest(status, transaction))
      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('licenceTypeAndLengthDisplay is called with the expected arguments', async () => {
      await getData(getMockRequest(status, transaction))
      expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('displayStartTime is called with the expected arguments', async () => {
      const mockRequest = getMockRequest(status, transaction)
      await getData(mockRequest)
      expect(displayStartTime).toHaveBeenCalledWith(mockRequest, permission)
    })

    it('displayEndTime is called with the expected arguments', async () => {
      const mockRequest = getMockRequest(status, transaction)
      await getData(mockRequest)
      expect(displayEndTime).toHaveBeenCalledWith(mockRequest, permission)
    })

    it('hasDisabled is called with the expected arguments', async () => {
      await getData(getMockRequest(status, transaction))
      expect(concessionHelper.hasDisabled).toHaveBeenCalledWith(permission)
    })

    it('getAgeConcession is called with the expected arguments', async () => {
      await getData(getMockRequest(status, transaction))
      expect(concessionHelper.getAgeConcession).toHaveBeenCalledWith(permission)
    })

    describe('returns expected licence data for the given permission:', () => {
      const licenceType = Symbol('Trout and coarse, up to 2 rods')
      licenceTypeDisplay.mockReturnValue(licenceType)

      const licenceLength = Symbol('8 days')
      licenceTypeAndLengthDisplay.mockReturnValue(licenceLength)

      const startTime = Symbol('9:32am on 23 June 2021')
      displayStartTime.mockReturnValue(startTime)

      const endTime = Symbol('9:32am on 23 June 2022')
      displayEndTime.mockReturnValue(endTime)

      const disabled = Symbol('disabled')
      concessionHelper.hasDisabled.mockReturnValue(disabled)

      const concession = Symbol('concession')
      concessionHelper.getAgeConcession.mockReturnValue(concession)

      it('referenceNumber', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].referenceNumber).toBe('123456789')
      })

      it('licenceHolder', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].licenceHolder).toBe('Turanga Leela')
      })

      it('obfuscatedDob', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].obfuscatedDob).toBe('obfuscatedDob')
      })

      it('type', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].type).toBe(licenceType)
      })

      it('length', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].length).toBe(licenceLength)
      })

      it('start', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].start).toBe(startTime)
      })

      it('end', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].end).toBe(endTime)
      })

      it('price', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].price).toBe(permission.permit.cost)
      })

      it('disabled', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].disabled).toBe(disabled)
      })

      it('ageConcession', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].ageConcession).toBe(concession)
      })

      it('index', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data.licences[0].index).toBe(0)
      })

      it('returns expected data', async () => {
        const data = await getData(getMockRequest(status, transaction))
        expect(data).toMatchSnapshot()
      })
    })

    describe('throws a Boom forbidden error', () => {
      it('if status agreed flag is not set', async () => {
        const status = () => ({})
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no agreed flag set')
        await expect(getData(getMockRequest(status, transaction))).rejects.toThrow(boomError)
      })

      it('if status posted flag is not set', async () => {
        const status = () => ({
          [COMPLETION_STATUS.agreed]: 'agreed'
        })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no posted flag set')
        await expect(getData(getMockRequest(status, transaction))).rejects.toThrow(boomError)
      })

      it('if status finalised flag is not set', async () => {
        const status = () => ({
          [COMPLETION_STATUS.agreed]: 'agreed',
          [COMPLETION_STATUS.posted]: 'posted'
        })
        const boomError = Boom.forbidden('Attempt to access the licence information handler with no finalised flag set')
        await expect(getData(getMockRequest(status, transaction))).rejects.toThrow(boomError)
      })
    })
  })
})

import { getData, validator } from '../route'
import { createMockRequest } from '../../../../__mocks__/request.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import * as constants from '@defra-fish/business-rules-lib'

import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'

// const mockStartAfterValue = null

jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('@defra-fish/business-rules-lib', () => ({
  START_AFTER_PAYMENT_MINUTES: (params = {}) => { return params }
}))

const permission = {
  licensee: {
    firstName: 'Turanga',
    lastName: 'Leela'
  },
  licenceType: 'trout-and-coarse',
  numberOfRods: '2',
  licenceLength: '8D',
  permit: { cost: 12 }
}

const catalog = Symbol('mock catalog')

describe('view-licences > default', () => {
  it('should call the pageRoute with view-licences, /buy/view-licences, validator and nextPage', async () => {
    expect(pageRoute).toBeCalledWith('view-licences', '/buy/view-licences', validator, nextPage, getData)
  })
})

describe('view licences > getData', () => {
  let data
  beforeAll(async () => {
    const mockRequest = createMockRequest({
      cache: {
        transaction: {
          permissions: [permission]
        }
      }
    })

    const sampleRequest = {
      ...mockRequest,
      i18n: {
        getCatalog: () => catalog
      }
    }

    licenceTypeDisplay.mockReturnValue('Trout and coarse, up to 2 rods')
    licenceTypeAndLengthDisplay.mockReturnValue('8 days')
    displayStartTime.mockReturnValue('9:32am on 23 June 2021')

    data = await getData(sampleRequest)
  })

  beforeEach(() => jest.clearAllMocks())

  describe('returns expected licence data for the given permission:', () => {
    it('licenceHolder', async () => {
      expect(data.licences[0].licenceHolder).toBe('Turanga Leela')
    })

    it('type', async () => {
      expect(data.licences[0].type).toBe('Trout and coarse, up to 2 rods')
    })

    it('length', async () => {
      expect(data.licences[0].length).toBe('8 days')
    })

    it('start', async () => {
      expect(data.licences[0].start).toBe('9:32am on 23 June 2021')
    })

    it('price', async () => {
      expect(data.licences[0].price).toBe(permission.permit.cost)
    })

    it('index', async () => {
      expect(data.licences[0].index).toBe(0)
    })
  })

  describe.only('getData', () => {
    const mockRequest = createMockRequest({
      cache: {
        transaction: {
          permissions: [permission]
        }
      }
    })

    const getSampleRequest = (startAfterPaymentMinutes = {}) => ({
      ...mockRequest,
      START_AFTER_PAYMENT_MINUTES: startAfterPaymentMinutes,
      i18n: {
        getCatalog: () => catalog
      }
    })

    beforeEach(() => jest.clearAllMocks())

    it('returns permissions, licences and text for start after minutes text', async () => {
      const res = await getData(getSampleRequest())
      expect(res).toMatchSnapshot()
    })

    it.each([[29], [31], [368]])('uses START_AFTER_PAYMENT_MINUTES environment variable for startAfterPaymentMinutes key', async startAfter => {
      const sampleRequest = getSampleRequest({ [constants.START_AFTER_PAYMENT_MINUTES(startAfter)]: startAfter })
      console.log('sampleRequest:', sampleRequest)
      const { startAfterPaymentMinutes } = await getData(sampleRequest)
      console.log('startAfterPaymentMinutes: ', startAfterPaymentMinutes)
      expect(startAfterPaymentMinutes).toEqual(startAfter)
    })

    it('licenceTypeDisplay is called with the expected arguments', async () => {
      await getData(getSampleRequest())

      expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeDisplay is used for type', async () => {
      const returnValue = Symbol('return value')
      licenceTypeDisplay.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const ret = result.licences[0].type

      expect(ret).toEqual(returnValue)
    })

    it('licenceTypeAndLengthDisplay is called with the expected arguments', async () => {
      await getData(getSampleRequest())
      expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, catalog)
    })

    it('return value of licenceTypeAndLengthDisplay is used for length', async () => {
      const returnValue = Symbol('return value')
      licenceTypeAndLengthDisplay.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const ret = result.licences[0].length

      expect(ret).toEqual(returnValue)
    })

    it('displayStartTime is called with the expected arguments', async () => {
      await getData(getSampleRequest())
      expect(displayStartTime).toHaveBeenCalledWith(getSampleRequest(), permission)
    })

    it('return value of displayStartTime is used for start', async () => {
      const returnValue = Symbol('return value')
      displayStartTime.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const ret = result.licences[0].start

      expect(ret).toEqual(returnValue)
    })
  })
})

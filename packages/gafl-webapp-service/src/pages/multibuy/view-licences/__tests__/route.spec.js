import { getData, validator } from '../route'
import { createMockRequest } from '../../../../__mocks__/request.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { hasDuplicates } from '../../../../processors/multibuy-processor.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { LICENCE_FOR } from '../../../../uri'

jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../routes/page-route.js')
jest.mock('../../../../processors/multibuy-processor.js')
jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((_request, uri) => uri)
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

const emptyPermission = {
  licensee: {}
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

    const getSampleRequest = () => ({
      ...mockRequest,
      i18n: {
        getCatalog: () => catalog
      },
      url: {
        search: ''
      }
    })

    licenceTypeDisplay.mockReturnValue('Trout and coarse, up to 2 rods')
    licenceTypeAndLengthDisplay.mockReturnValue('8 days')
    displayStartTime.mockReturnValue('9:32am on 23 June 2021')

    data = await getData(getSampleRequest())
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

  describe('getData', () => {
    const mockRequestPermission = createMockRequest({
      cache: {
        transaction: {
          permissions: [permission]
        }
      }
    })

    const getSampleRequest = () => ({
      ...mockRequestPermission,
      i18n: {
        getCatalog: () => catalog
      },
      url: {
        search: ''
      }
    })

    const mockRequestNoPermission = createMockRequest({
      cache: {
        transaction: {
          permissions: [emptyPermission]
        }
      }
    })

    const getMockRequest = () => ({
      ...mockRequestNoPermission,
      i18n: {
        getCatalog: () => catalog
      },
      url: {
        search: ''
      }
    })

    beforeEach(() => jest.clearAllMocks())

    it('returns duplicate, licences, licences remaining being true and uri matching licence for', async () => {
      const res = await getData(getSampleRequest())
      expect(res).toMatchSnapshot()
    })

    it('returns false duplicate, null licences, licences remaining being false and uri matching licence for', async () => {
      const res = await getData(getMockRequest())
      expect(res).toMatchSnapshot()
    })

    it('licences remaining', async () => {
      const data = await getData(getSampleRequest())
      expect(data.licencesRemaining).toBe(true)
    })

    it('no licences remaining', async () => {
      const data = await getData(getMockRequest())
      expect(data.licencesRemaining).toBe(false)
    })

    it('duplicates', async () => {
      hasDuplicates.mockReturnValueOnce(false)
      const data = await getData(getSampleRequest())
      expect(data.duplicate).toBe(false)
    })

    it('no duplicate', async () => {
      hasDuplicates.mockReturnValueOnce(true)
      const data = await getData(getSampleRequest())
      expect(data.duplicate).toBe(true)
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
      const sampleRequest = getSampleRequest()
      await getData(sampleRequest)
      expect(displayStartTime).toHaveBeenCalledWith(sampleRequest, permission)
    })

    it('return value of displayStartTime is used for start', async () => {
      const returnValue = Symbol('return value')
      displayStartTime.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const ret = result.licences[0].start

      expect(ret).toEqual(returnValue)
    })

    it('return value of addLangaugeCodeToUri is used for licence for', async () => {
      const returnValue = Symbol('return value')
      addLanguageCodeToUri.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const uri = result.uri.licence_for

      expect(uri).toEqual(returnValue)
    })

    it('addLanguageCodeToUri is called with request and licence for uri', async () => {
      const request = getSampleRequest()

      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, LICENCE_FOR.uri)
    })
  })
})

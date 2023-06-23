import { getData, validator } from '../route'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { hasDuplicates } from '../../../../processors/multibuy-processor.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import { ADD_LICENCE, NEW_TRANSACTION } from '../../../../uri'

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

const catalog = Symbol('mock catalog')

const getSampleCatalog = () => ({
  licence_summary_licence_holder: 'Name',
  licence_summary_type: 'Type',
  licence_summary_length: 'Length',
  licence_summary_start: 'Start',
  licence_summary_price: 'Price',
  pound: '£'
})

describe('view-licences > default', () => {
  it('should call the pageRoute with view-licences, /buy/view-licences, validator and nextPage', async () => {
    expect(pageRoute).toBeCalledWith('view-licences', '/buy/view-licences', validator, nextPage, getData)
  })
})

describe('view licences > getData', () => {
  let data
  beforeAll(async () => {
    const getSampleRequest = () => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: async () => ({ permissions: [permission] })
          }
        }
      }),
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
    const getMockEmptyPermission = () => ({
      licensee: {}
    })

    const getMockPermission = () => ({
      licensee: {
        firstName: 'Turanga',
        lastName: 'Leela'
      },
      licenceType: 'trout-and-coarse',
      numberOfRods: '2',
      licenceLength: '8D',
      permit: { cost: 12 }
    })

    const getSampleRequest = ({
      currentPermission = getMockPermission(),
      getTransaction = async () => ({ permissions: [currentPermission] }),
      getCatalog = () => getSampleCatalog()
    } = {}) => ({
      cache: () => ({
        helpers: {
          transaction: {
            get: getTransaction
          }
        }
      }),
      i18n: {
        getCatalog
      },
      url: {
        search: ''
      }
    })

    beforeEach(() => jest.clearAllMocks())

    it('returns duplicate, licences, licences remaining being true and uri matching add licence', async () => {
      const res = await getData(getSampleRequest())
      expect(res).toMatchSnapshot()
    })

    it('returns false duplicate, licence information, undefined licences, licences remaining being false and uri matching new transaction', async () => {
      const res = await getData(getSampleRequest({ currentPermission: getMockEmptyPermission() }))
      expect(res).toMatchSnapshot()
    })

    it('licences has value if licences left', async () => {
      const data = await getData(getSampleRequest())
      expect(data.licences).not.toBe(undefined)
    })

    it('licences to be empty array if no licences', async () => {
      const data = await getData(getSampleRequest({ currentPermission: getMockEmptyPermission() }))
      expect(data.licences).toStrictEqual([])
    })

    it('licences remaining', async () => {
      const data = await getData(getSampleRequest())
      expect(data.licencesRemaining).toBe(true)
    })

    it('no licences remaining', async () => {
      const data = await getData(getSampleRequest({ currentPermission: getMockEmptyPermission() }))
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
      await getData(getSampleRequest({ getCatalog: () => catalog }))
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
      await getData(getSampleRequest({ getCatalog: () => catalog }))
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

    it('return value of addLangaugeCodeToUri is used for add licence', async () => {
      const returnValue = '/buy/add-licence'
      addLanguageCodeToUri.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest())
      const uri = result.uri.add_licence

      expect(uri).toEqual(returnValue)
    })

    it('addLanguageCodeToUri is called with request and add licence uri', async () => {
      const request = getSampleRequest()

      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, ADD_LICENCE.uri)
    })

    it('return value of addLangaugeCodeToUri is used for new transaction', async () => {
      const returnValue = Symbol('return value')
      addLanguageCodeToUri.mockReturnValueOnce(returnValue)

      const result = await getData(getSampleRequest({ currentPermission: getMockEmptyPermission() }))
      const uri = result.uri.new

      expect(uri).toEqual(returnValue)
    })

    it('addLanguageCodeToUri is called with request and new uri', async () => {
      const request = getSampleRequest({ currentPermission: getMockEmptyPermission() })

      await getData(request)

      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, NEW_TRANSACTION.uri)
    })
  })
})

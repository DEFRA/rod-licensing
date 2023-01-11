import { getData, validator } from '../route.js'
import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { VIEW_LICENCES } from '../../../../uri.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../../processors/date-and-time-display.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

jest.mock('../../../../processors/uri-helper.js', () => ({
  addLanguageCodeToUri: jest.fn((_request, uri) => uri)
}))
jest.mock('../../../../processors/licence-type-display.js')
jest.mock('../../../../processors/date-and-time-display.js')
jest.mock('../../../../routes/page-route.js')

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

describe('remove-licence > default', () => {
  it('should call the pageRoute with remove-licence, /buy/remove-licence, validator and nextPage', async () => {
    expect(pageRoute).toBeCalledWith('remove-licence', '/buy/remove-licence', validator, nextPage, getData)
  })
})

describe('remove-licence > getData', () => {
  const getMockRequest = permission => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => permission
        },
        status: {
          set: jest.fn()
        }
      }
    }),
    i18n: {
      getCatalog: () => catalog
    },
    query: {}
  })

  beforeEach(() => jest.clearAllMocks())

  it('expected data from getData', async () => {
    licenceTypeDisplay.mockReturnValueOnce('Trout and coarse, up to 2 rods')
    licenceTypeAndLengthDisplay.mockReturnValueOnce('8 days')
    displayStartTime.mockReturnValueOnce('9:32am on 23 June 2021')
    addLanguageCodeToUri.mockReturnValueOnce('/buy/remove-licence')

    const data = await getData(getMockRequest(permission))
    expect(data).toMatchSnapshot()
  })

  it('licenceTypeDisplay is called with the expected arguments', async () => {
    await getData(getMockRequest(permission))

    expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
  })

  it('return value of licenceTypeDisplay is used for type', async () => {
    const returnValue = Symbol('return value')
    licenceTypeDisplay.mockReturnValueOnce(returnValue)

    const result = await getData(getMockRequest(permission))

    expect(result.type).toEqual(returnValue)
  })

  it('licenceTypeAndLengthDisplay is called with the expected arguments', async () => {
    await getData(getMockRequest(permission))
    expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, catalog)
  })

  it('return value of licenceTypeAndLengthDisplay is used for length', async () => {
    const returnValue = Symbol('return value')
    licenceTypeAndLengthDisplay.mockReturnValueOnce(returnValue)

    const result = await getData(getMockRequest(permission))

    expect(result.length).toEqual(returnValue)
  })

  it('displayStartTime is called with the expected arguments', async () => {
    const sampleRequest = getMockRequest(permission)
    await getData(sampleRequest)
    expect(displayStartTime).toHaveBeenCalledWith(sampleRequest, permission)
  })

  it('return value of displayStartTime is used for start', async () => {
    const returnValue = Symbol('return value')
    displayStartTime.mockReturnValueOnce(returnValue)

    const result = await getData(getMockRequest(permission))

    expect(result.start).toEqual(returnValue)
  })

  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const sampleRequest = getMockRequest(permission)
    await getData(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, VIEW_LICENCES.uri)
  })

  it('return value of addLanguageCodeToUri is used for uri.view_licences', async () => {
    const returnValue = Symbol('return value')
    addLanguageCodeToUri.mockReturnValueOnce(returnValue)

    const result = await getData(getMockRequest(permission))

    expect(result.uri.view_licences).toEqual(returnValue)
  })
})

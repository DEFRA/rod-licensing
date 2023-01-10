import { getData, validator } from '../route.js'
import { createMockRequest } from '../../../../__mocks__/request.js'
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
    }
  })

  licenceTypeDisplay.mockReturnValue('Trout and coarse, up to 2 rods')
  licenceTypeAndLengthDisplay.mockReturnValue('8 days')
  displayStartTime.mockReturnValue('9:32am on 23 June 2021')
  addLanguageCodeToUri.mockReturnValue('/buy/remove-licence')

  it('expected data from getData', async () => {
    const data = await getData(getSampleRequest())
    expect(data).toMatchSnapshot()
  })
})

describe('getData', () => {
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
    }
  })

  beforeEach(() => jest.clearAllMocks())

  it('licenceTypeDisplay is called with the expected arguments', async () => {
    await getData(getSampleRequest())

    expect(licenceTypeDisplay).toHaveBeenCalledWith(permission, catalog)
  })

  it('return value of licenceTypeDisplay is used for type', async () => {
    const returnValue = Symbol('return value')
    licenceTypeDisplay.mockReturnValueOnce(returnValue)

    const result = await getData(getSampleRequest())

    expect(result.type).toEqual(returnValue)
  })

  it('licenceTypeAndLengthDisplay is called with the expected arguments', async () => {
    await getData(getSampleRequest())
    expect(licenceTypeAndLengthDisplay).toHaveBeenCalledWith(permission, catalog)
  })

  it('return value of licenceTypeAndLengthDisplay is used for length', async () => {
    const returnValue = Symbol('return value')
    licenceTypeAndLengthDisplay.mockReturnValueOnce(returnValue)

    const result = await getData(getSampleRequest())

    expect(result.length).toEqual(returnValue)
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

    expect(result.start).toEqual(returnValue)
  })

  it('addLanguageCodeToUri is called with the expected arguments', async () => {
    const sampleRequest = getSampleRequest()
    await getData(sampleRequest)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(sampleRequest, VIEW_LICENCES.uri)
  })

  it('return value of addLanguageCodeToUri is used for uri.view_licences', async () => {
    const returnValue = Symbol('return value')
    addLanguageCodeToUri.mockReturnValueOnce(returnValue)

    const result = await getData(getSampleRequest())

    expect(result.uri.view_licences).toEqual(returnValue)
  })
})

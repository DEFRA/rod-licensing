import pageRoute from '../../../../routes/page-route.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
require('../route.js') // require rather than import to avoid lint error with unused variable

jest.mock('../../../../routes/page-route.js', () => jest.fn())
jest.mock('../../../../uri.js', () => ({
  IDENTIFY: { page: 'identify page', uri: 'identify uri' },
  AUTHENTICATE: { uri: Symbol('authenticate uri') }
}))
jest.mock('../../../../processors/uri-helper.js')

describe('page route next', () => {
  const nextPage = pageRoute.mock.calls[0][3]
  beforeEach(jest.clearAllMocks)

  it('passes a function as the nextPage argument', () => {
    expect(typeof nextPage).toBe('function')
  })

  it('calls addLanguageCodeToUri', () => {
    nextPage()
    expect(addLanguageCodeToUri).toHaveBeenCalled()
  })

  it('passes request to addLanguageCodeToUri', () => {
    const request = Symbol('request')
    nextPage(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, expect.anything())
  })

  it('next page returns result of addLanguageCodeToUri', () => {
    const expectedResult = Symbol('add language code to uri')
    addLanguageCodeToUri.mockReturnValueOnce(expectedResult)
    expect(nextPage()).toBe(expectedResult)
  })
})

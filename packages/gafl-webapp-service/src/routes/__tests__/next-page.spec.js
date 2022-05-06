import { nextPage } from '../next-page.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'

/* jest.mock('../../handlers/update-transaction-functions.js') */
jest.mock('../journey-definition.js', () => [
  { current: { page: 'start', uri: '/start' }, next: { okay: { page: { uri: '/after/start' } } } },
  { current: { page: 'not-start', uri: '/not/start', next: { okay: { page: { uri: '/next/page' } } } } }
])
jest.mock('../../handlers/result-functions.js', () => ({ start: () => 'okay' }))
jest.mock('../../processors/uri-helper.js')

describe('nextPage', () => {
  beforeEach(jest.resetAllMocks)

  it.each([
    ['start', '/after/start'],
    ['not-start', '/not/start']
  ])('passes request and route node to addLanguageCodeToUri', async (currentPage, uri) => {
    const request = getSampleRequest(currentPage)
    await nextPage(request)
    expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, uri)
  })

  it.each([
    ['start', '/after/start'],
    ['not-start', '/not/start']
  ])('returns result of addLanguageCodeToUri', async (currentPage, uri) => {
    const request = getSampleRequest(currentPage)
    const returnValue = Symbol(uri)
    addLanguageCodeToUri.mockReturnValueOnce(returnValue)

    const result = await nextPage(request)

    expect(result).toEqual(returnValue)
  })
})

const getSampleRequest = (currentPage = 'start') => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => ({
          currentPage
        })
      }
    }
  })
})

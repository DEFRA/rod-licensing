import { nextPage } from '../next-page.js'

jest.mock('../journey-definition.js', () => [
  { current: { page: 'start', uri: '/start' }, next: { okay: { page: { uri: '/after/start' } } } },
  { current: { page: 'not-start', uri: '/not/start', next: { okay: { page: { uri: '/next/page' } } } } },
  { current: { page: 'error-page', uri: '/error/page' } } // Terminal page without next property
])
jest.mock('../../handlers/result-functions.js', () => ({ start: () => 'okay' }))

describe('nextPage', () => {
  beforeEach(jest.resetAllMocks)

  it.each([
    ['start', '/after/start'],
    ['not-start', '/not/start']
  ])('returns the expected uri', async (currentPage, uri) => {
    const request = getSampleRequest(currentPage)

    const result = await nextPage(request)

    expect(result).toEqual(uri)
  })
})

describe('Terminal pages (no next property)', () => {
  it('returns current page URI when routeNode has no next property', async () => {
    const request = getSampleRequest('error-page')
    const result = await nextPage(request)
    expect(result).toEqual('/error/page')
  })

  it('does not execute result functions for terminal pages', async () => {
    const request = getSampleRequest('error-page')
    await nextPage(request)
    // Result function should not be called
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

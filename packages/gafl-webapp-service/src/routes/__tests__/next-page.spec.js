import { nextPage } from '../next-page.js'

jest.mock('../journey-definition.js', () => [
  { current: { page: 'start', uri: '/start' }, next: { okay: { page: { uri: '/after/start' } } } },
  { current: { page: 'not-start', uri: '/not/start', next: { okay: { page: { uri: '/next/page' } } } } }
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

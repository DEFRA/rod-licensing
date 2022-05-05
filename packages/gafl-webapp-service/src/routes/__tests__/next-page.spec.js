import { nextPage } from '../next-page.js'

/* jest.mock('../../handlers/update-transaction-functions.js') */
jest.mock('../journey-definition.js', () => [
  { current: { page: 'start', uri: '/start' }, next: { okay: { page: { uri: '/after/start' } } } },
  { current: { page: 'not-start', uri: '/not/start', next: { okay: { page: { uri: '/next/page' } } } } }
])
jest.mock('../../handlers/result-functions.js', () => ({ start: () => 'okay' }))

describe('nextPage', () => {
  it.each(['?lang=cy', '?data=blah&lang=cy&rods=5'])('persists welsh language in next page url', async search => {
    const np = await nextPage(getSampleRequest(search))
    expect(np).toEqual(expect.stringMatching(/^\/after\/start\?lang=cy$/))
  })
  it("omits welsh language when it's not required", async () => {
    const np = await nextPage(getSampleRequest(''))
    expect(np).toEqual(expect.stringMatching(/^\/after\/start$/))
  })
  it.each(['?lang=cy', '?data=shmata&lang=cy&type=salmon'])('persists welsh language if reloading current page', async search => {
    const np = await nextPage(getSampleRequest(search, 'not-start'))
    expect(np).toEqual(expect.stringMatching(/^\/not\/start\?lang=cy$/))
  })
})

const getSampleRequest = (search, currentPage = 'start') => ({
  cache: () => ({
    helpers: {
      status: {
        getCurrentPermission: () => ({
          currentPage
        })
      }
    }
  }),
  url: {
    search
  }
})

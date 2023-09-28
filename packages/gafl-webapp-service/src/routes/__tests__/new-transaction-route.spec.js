import { start, stop, server } from '../../__mocks__/test-utils-system.js'
import * as sessionManager from '../../session-cache/session-manager'
const spy = jest.spyOn(sessionManager, 'default')

// Start application before running the test case
beforeAll(() => new Promise(resolve => start(resolve)))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The new transaction route clears the cache and invokes the controller invokes the controller', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/new'
    })
    expect(spy).toBeCalled()
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy#')
  })
})

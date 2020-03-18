'use strict'

import { start, stop, server } from '../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The default route invokes the controller', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/controller')
  })
})

'use strict'

import { start, stop, server } from '../../../misc/test-utils.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The no licence required page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: '/buy/no-licence-required'
    })
    expect(data.statusCode).toBe(200)
  })
})

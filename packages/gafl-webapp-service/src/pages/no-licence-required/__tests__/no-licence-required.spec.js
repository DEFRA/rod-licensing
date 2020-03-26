'use strict'

import { start, stop, server } from '../../../misc/test-utils.js'
import { NO_LICENCE_REQUIRED } from '../../../constants.js'

// Start application before running the test case
beforeAll(d => start(d))

// Stop application after running the test case
afterAll(d => stop(d))

describe('The no licence required page', () => {
  it('Return success on requesting', async () => {
    const data = await server.inject({
      method: 'GET',
      url: NO_LICENCE_REQUIRED.uri
    })
    expect(data.statusCode).toBe(200)
  })
})

import {
  VIEW_LICENCES
} from '../../../../uri.js'

import { ADULT_FULL_1_DAY_LICENCE } from '../../../../__mocks__/mock-journeys.js'
import { start, stop, initialize, injectWithCookies } from '../../../../__mocks__/test-utils-system.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The view licences page', () => {
  it('Return success on requesting', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    const response = await injectWithCookies('GET', VIEW_LICENCES.uri)
    expect(response.statusCode).toBe(302)
  })
})
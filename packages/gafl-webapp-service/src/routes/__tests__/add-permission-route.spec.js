import { start, stop, initialize, injectWithCookies } from '../../__mocks__/test-utils.js'
import { ADD_PERMISSION, NEW_TRANSACTION, TEST_TRANSACTION } from '../../uri.js'
import { MAX_PERMISSIONS_PER_TRANSACTION } from '@defra-fish/business-rules-lib'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

describe('The new permission handler', () => {
  it('Adds new permission objects to the transaction cache', async () => {
    // Add a permission
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    let res = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(res.payload).permissions.length).toBe(1)

    // Add a permission
    await injectWithCookies('GET', ADD_PERMISSION.uri)
    res = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(res.payload).permissions.length).toBe(2)
  })

  it('Ensure that we cannot overload the redis cache by doing this continually', async () => {
    await injectWithCookies('GET', NEW_TRANSACTION.uri)
    for (let i = 0; i < MAX_PERMISSIONS_PER_TRANSACTION; i++) {
      await injectWithCookies('GET', ADD_PERMISSION.uri)
    }
    let res = await injectWithCookies('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(res.payload).permissions.length).toBe(MAX_PERMISSIONS_PER_TRANSACTION)
    res = await injectWithCookies('GET', ADD_PERMISSION.uri)
    expect(res.statusCode).toBe(400)
  })
})

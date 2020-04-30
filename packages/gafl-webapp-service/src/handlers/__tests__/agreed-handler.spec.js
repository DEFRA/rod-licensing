import each from 'jest-each'
import { initialize, injectWithCookie, start, stop } from '../../__mocks__/test-utils'
import {
  ADULT_FULL_1_DAY_LICENCE,
  ADULT_DISABLED_12_MONTH_LICENCE,
  SENIOR_12_MONTH_LICENCE,
  MOCK_CONCESSIONS,
  JUNIOR_12_MONTH_LICENCE
} from '../../__mocks__/mock-journeys.js'

import { AGREED, FINALISED, TEST_TRANSACTION, TEST_STATUS } from '../../constants.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('throw a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })

  each([
    ['adult full 1 day licence', ADULT_FULL_1_DAY_LICENCE],
    ['adult disabled 12 month licence', ADULT_DISABLED_12_MONTH_LICENCE],
    ['senior 12 month licence', SENIOR_12_MONTH_LICENCE],
    ['junior 12 month licence', JUNIOR_12_MONTH_LICENCE]
  ]).it(
    "for an %s posts the transaction payload and sets the 'posted' flag and redirects to the finalised handler",
    async (desc, journey) => {
      await journey.setup()
      fetch
        .mockImplementationOnce(
          async () =>
            new Promise(resolve =>
              resolve({
                json: () => MOCK_CONCESSIONS,
                ok: true
              })
            )
        )
        .mockImplementationOnce(
          async () =>
            new Promise(resolve =>
              resolve({
                json: () => journey.transActionResponse,
                ok: true
              })
            )
        )
      const data = await injectWithCookie('GET', AGREED.uri)
      expect(data.statusCode).toBe(302)
      expect(data.headers.location).toBe(FINALISED.uri)
      const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
      expect(JSON.parse(payload).id).toBe(journey.transActionResponse.id)
      const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
      expect(JSON.parse(status).agreed).toBeTruthy()
      expect(JSON.parse(status).posted).toBeTruthy()
      expect(JSON.parse(status).finalised).not.toBeTruthy()
    }
  )

  it('if a transaction has already been posted it is not posted again', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.headers.location).toBe(FINALISED.uri)
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })

  it('throw a status 500 (server) exception and the posted status is not set if there is an error fetching reference data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch.mockImplementationOnce(
      async () =>
        new Promise(resolve =>
          resolve({
            json: () => ({}),
            ok: false
          })
        )
    )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).not.toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })

  it('throw a status 500 (server) exception and the posted status is not set if the post data does not return OK', async () => {
    fetch.mockReset()
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => ({}),
              ok: false
            })
          )
      )
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).not.toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })

  it('throw a status 500 (server) exception and the posted status is not set if there is an error thrown posing data', async () => {
    await ADULT_FULL_1_DAY_LICENCE.setup()
    fetch
      .mockImplementationOnce(
        async () =>
          new Promise(resolve =>
            resolve({
              json: () => MOCK_CONCESSIONS,
              ok: true
            })
          )
      )
      .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error())))
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(500)
    const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
    expect(JSON.parse(payload).id).not.toBeTruthy()
    const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
    expect(JSON.parse(status).agreed).toBeTruthy()
    expect(JSON.parse(status).posted).not.toBeTruthy()
    expect(JSON.parse(status).finalised).not.toBeTruthy()
  })
})

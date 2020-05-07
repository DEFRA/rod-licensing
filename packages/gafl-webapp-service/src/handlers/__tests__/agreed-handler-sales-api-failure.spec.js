import each from 'jest-each'
import { initialize, injectWithCookie, start, stop } from '../../__mocks__/test-utils'
import {
  ADULT_FULL_1_DAY_LICENCE,
  ADULT_DISABLED_12_MONTH_LICENCE,
  SENIOR_12_MONTH_LICENCE,
  MOCK_CONCESSIONS,
  JUNIOR_12_MONTH_LICENCE
} from '../../__mocks__/mock-journeys.js'

import { COMPLETION_STATUS } from '../../constants.js'
import { AGREED, TEST_TRANSACTION, TEST_STATUS, ORDER_COMPLETE } from '../../uri.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

jest.mock('node-fetch')
const fetch = require('node-fetch')

describe('The agreed handler', () => {
  it('throws a status 403 (forbidden) exception is the agreed flag is not set', async () => {
    const data = await injectWithCookie('GET', AGREED.uri)
    expect(data.statusCode).toBe(403)
  })



  // it('posts a 500 error with the retry flag set if the GOV.UK Pay API throws a recoverable exception ', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error('Timed Out'))))
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   expect(data.payload.includes('Try again')).toBeTruthy()
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('posts a 500 error with the retry flag set if the GOV.UK Pay API rate limit is exceeded', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ({
  //               code: 'P0900',
  //               description: 'Too many requests'
  //             }),
  //             ok: false,
  //             status: 429
  //           })
  //         )
  //     )
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   expect(data.payload.includes('Try again')).toBeTruthy()
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 400 error', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ({
  //               code: 'P0200',
  //               description: 'paymentId not found'
  //             }),
  //             ok: false,
  //             status: 404
  //           })
  //         )
  //     )
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   expect(data.payload.includes('Try again')).not.toBeTruthy()
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('posts a 500 error without the retry flag set if the GOV.UK Pay API returns any arbitrary 500 error', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ADULT_FULL_1_DAY_LICENCE.transActionResponse,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ({
  //               code: 'P0999',
  //               description: 'GOV.UK Pay is unavailable'
  //             }),
  //             ok: false,
  //             status: 500
  //           })
  //         )
  //     )
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   expect(data.payload.includes('Try again')).not.toBeTruthy()
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).toBe(ADULT_FULL_1_DAY_LICENCE.transActionResponse.id)
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.paymentCreated]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.payed]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('throw a status 500 (server) exception and the posted status is not set if there is an error fetching reference data', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch.mockImplementationOnce(
  //     async () =>
  //       new Promise(resolve =>
  //         resolve({
  //           json: () => ({}),
  //           ok: false
  //         })
  //       )
  //   )
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).not.toBeTruthy()
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('throws a status 500 (server) exception and the posted status is not set if the post data does not return OK', async () => {
  //   fetch.mockReset()
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => ({}),
  //             ok: false
  //           })
  //         )
  //     )
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).not.toBeTruthy()
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
  //
  // it('throws a status 500 (server) exception and the posted status is not set if there is an error thrown posing data', async () => {
  //   await ADULT_FULL_1_DAY_LICENCE.setup()
  //   fetch
  //     .mockImplementationOnce(
  //       async () =>
  //         new Promise(resolve =>
  //           resolve({
  //             json: () => MOCK_CONCESSIONS,
  //             ok: true
  //           })
  //         )
  //     )
  //     .mockImplementationOnce(async () => new Promise((resolve, reject) => reject(new Error())))
  //   const data = await injectWithCookie('GET', AGREED.uri)
  //   expect(data.statusCode).toBe(500)
  //   const { payload } = await injectWithCookie('GET', TEST_TRANSACTION.uri)
  //   expect(JSON.parse(payload).id).not.toBeTruthy()
  //   const { payload: status } = await injectWithCookie('GET', TEST_STATUS.uri)
  //   expect(JSON.parse(status)[COMPLETION_STATUS.agreed]).toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.posted]).not.toBeTruthy()
  //   expect(JSON.parse(status)[COMPLETION_STATUS.finalised]).not.toBeTruthy()
  // })
})

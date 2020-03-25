'use strict'

'use strict'

import moment from 'moment'
import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const dob13Today = moment().add(-13, 'years')
const dob13Tomorrow = moment()
  .add(-13, 'years')
  .add(1, 'day')
const dob16Today = moment().add(-16, 'years')
const dob16Tomorrow = moment()
  .add(-16, 'years')
  .add(1, 'day')
// const dob65Today = moment().add(-65, 'years')
// const dob65Tomorrow = moment().add(-65, 'years').add(1, 'day')

const dateHelper = d => ({
  'date-of-birth-day': d.date().toString(),
  'date-of-birth-month': (d.month() + 1).toString(),
  'date-of-birth-year': d.year()
})

describe('The date of birth page', () => {
  it('return success on requesting the page', async () => {
    const data = await injectWithCookie('GET', '/buy/date-of-birth')
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', '/buy/date-of-birth', {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/date-of-birth')
  })

  it('redirects back to itself on posting an invalid date', async () => {
    const data = await injectWithCookie('POST', '/buy/date-of-birth', {
      'date-of-birth-day': '45',
      'date-of-birth-month': '13',
      'date-of-birth-year': '1970'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/date-of-birth')
  })

  it(`my licence starts immediately after payment and my date of birth is ${dob13Tomorrow.format(
    'YYYY-MM-DD'
  )} and I do not require a fishing licence`, async () => {
    await injectWithCookie('POST', '/buy/start-kind', { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/date-of-birth', dateHelper(dob13Tomorrow))
    const data = await injectWithCookie('GET', '/buy')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/no-licence-required')
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob13Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).toBeTruthy()
  })

  it(`my licence starts immediately after payment and my date of birth is ${dob13Today.format(
    'YYYY-MM-DD'
  )} and I require a junior 12 month fishing licence`, async () => {
    await injectWithCookie('POST', '/buy/start-kind', { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/licence-length', { 'licence-length': '1D' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/date-of-birth', dateHelper(dob13Today))
    const data = await injectWithCookie('GET', '/buy')
    expect(data.statusCode).toBe(302)
    // expect(data.headers.location).toBe('/buy/no-licence-required')
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob13Today.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).toBe('junior')
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('12M')
  })

  it(`my licence starts immediately after payment and my date of birth is ${dob16Tomorrow.format(
    'YYYY-MM-DD'
  )} and I require a junior 12 month fishing licence`, async () => {
    await injectWithCookie('POST', '/buy/start-kind', { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/date-of-birth', dateHelper(dob16Tomorrow))
    const data = await injectWithCookie('GET', '/buy')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/no-licence-required')
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob16Tomorrow.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].concession).toBe('junior')
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
  })

  it(`my licence starts immediately after payment and my date of birth is ${dob16Today.format(
    'YYYY-MM-DD'
  )} and I require an adult fishing licence`, async () => {
    await injectWithCookie('POST', '/buy/start-kind', { 'licence-to-start': 'after-payment' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/licence-length', { 'licence-length': '1D' })
    await injectWithCookie('GET', '/buy')
    await injectWithCookie('POST', '/buy/date-of-birth', dateHelper(dob16Today))
    const data = await injectWithCookie('GET', '/buy')
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/no-licence-required')
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].dateOfBirth).toBe(dob16Today.format('YYYY-MM-DD'))
    expect(JSON.parse(payload).permissions[0].noLicenceRequired).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].concession).not.toBeTruthy()
    expect(JSON.parse(payload).permissions[0].licenceLength).toBe('1D')
  })
})

import { start, stop, initialize, injectWithCookie } from '../../../misc/test-utils.js'
import moment from 'moment'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

// Start application before running the test case
describe('The licence start date page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', '/buy/start-date')
    expect(data.statusCode).toBe(200)
  })
  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', '/buy/start-date', {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/start-date')
  })
  it('redirects back to itself on an invalid date', async () => {
    const data = await injectWithCookie('POST', '/buy/start-date', {
      'licence-start-date-year': '2020',
      'licence-start-date-month': '11',
      'licence-start-date-day': '35'
    })
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/start-date')
  })
  it('redirects back to itself posting a date greater than 60 days hence', async () => {
    const fdate = moment().add(61, 'days')
    const payload = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }

    const data = await injectWithCookie('POST', '/buy/start-date', payload)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/start-date')
  })
  it('redirects back to itself posting a date in the past', async () => {
    const fdate = moment().add(-1, 'days')
    const payload = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }

    const data = await injectWithCookie('POST', '/buy/start-date', payload)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy/start-date')
  })

  it('stores the transaction on successful submission of a valid date', async () => {
    const fdate = moment().add(5, 'days')
    const body = {
      'licence-start-date-year': fdate.year().toString(),
      'licence-start-date-month': (fdate.month() + 1).toString(),
      'licence-start-date-day': fdate.date().toString()
    }

    const data = await injectWithCookie('POST', '/buy/start-date', body)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe('/buy')

    await injectWithCookie('GET', '/buy')

    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licenceStartDate).toBe(fdate.format('YYYY-MM-DD'))
  })
})

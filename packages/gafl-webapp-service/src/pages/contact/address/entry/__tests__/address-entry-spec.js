import { ADDRESS_ENTRY, CONTACT } from '../../../../../constants.js'
import { start, stop, initialize, injectWithCookie, postRedirectGet } from '../../../../../__mocks__/test-utils.js'

beforeAll(d => start(d))
beforeAll(d => initialize(d))
afterAll(d => stop(d))

const goodAddress = {
  premises: '14 HOWECROFT COURT',
  street: 'EASTMEAD LANE',
  locality: '',
  town: 'BRISTOL',
  postcode: 'BS9 1HJ',
  'country-code': 'GB'
}

describe('The manual address entry page', () => {
  it('returns success on requesting', async () => {
    const data = await injectWithCookie('GET', ADDRESS_ENTRY.uri)
    expect(data.statusCode).toBe(200)
  })

  it('redirects back to itself on posting no response', async () => {
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, {})
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting address with no premises', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr.premises
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long premises', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.premises = 'A'.repeat(101)
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long street', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.street = 'A'.repeat(101)
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long locality', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.locality = 'A'.repeat(101)
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting address with no town', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr.town
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting too long town', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.town = 'A'.repeat(101)
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting with missing country code', async () => {
    const addr = Object.assign({}, goodAddress)
    delete addr['country-code']
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('redirects back to itself on posting invalid UK postcode', async () => {
    const addr = Object.assign({}, goodAddress)
    addr.postcode = 'foo'
    const data = await injectWithCookie('POST', ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(ADDRESS_ENTRY.uri)
  })

  it('controller redirects to contact page on posting a valid UK address', async () => {
    const addr = Object.assign({}, goodAddress)
    const data = await postRedirectGet(ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('The contact information has been set in the transaction', async () => {
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      premises: '14 Howecroft Court',
      street: 'Eastmead Lane',
      town: 'Bristol',
      postcode: 'BS9 1HJ',
      countryCode: 'GB'
    })
  })

  it('controller redirects to contact page on posting a valid non-UK address', async () => {
    const addr = Object.assign({}, goodAddress)
    addr['country-code'] = 'FR'
    addr.postcode = 'not checked'
    const data = await postRedirectGet(ADDRESS_ENTRY.uri, addr)
    expect(data.statusCode).toBe(302)
    expect(data.headers.location).toBe(CONTACT.uri)
  })

  it('The contact information has been set in the transaction', async () => {
    const { payload } = await injectWithCookie('GET', '/buy/transaction')
    expect(JSON.parse(payload).permissions[0].licensee).toEqual({
      premises: '14 Howecroft Court',
      street: 'Eastmead Lane',
      town: 'Bristol',
      postcode: 'not checked',
      countryCode: 'FR'
    })
  })
})

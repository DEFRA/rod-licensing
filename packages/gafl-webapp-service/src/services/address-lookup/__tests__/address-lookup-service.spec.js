import als from '../address-lookup-service.js'
import fetch from 'node-fetch'

jest.mock('node-fetch')

describe('Address lookup service', () => {
  beforeAll(() => {
    process.env.ADDRESS_LOOKUP_KEY = 'ADDRESS_LOOKUP_KEY'
    process.env.ADDRESS_LOOKUP_URL = 'https://address.lookup.url'
  })

  it('returns empty array if results node is missing', async () => {
    fetch.mockResolvedValue({ json: () => Promise.resolve({}) })
    const results = await als()
    expect(results).toEqual([])
  })
})

import { getData } from '../route'
import uri from '../../../../../uri.js'

jest.mock('../../../../../uri.js', () => ({
  ADDRESS_LOOKUP: { uri: '/address/lookup' },
  ADDRESS_ENTRY: { uri: '/address/entry' },
  OS_TERMS: { uri: '/os/terms' }
}))
jest.mock('../../../../../routes/next-page.js', () => ({ nextPage: () => {} }))
jest.mock('../../../../../routes/page-route.js', () => () => {})

describe('address-lookup > route', () => {
  describe('getData', () => {
    it('return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const result = await getData(getMockRequest(() => ({ concessions: [], isLicenceForYou: true })))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const result = await getData(getMockRequest(() => ({ concessions: [], isLicenceForYou: false })))
      expect(result.isLicenceForYou).toBeFalsy()
    })

    describe.each([
      ['entryPage', uri.ADDRESS_ENTRY.uri],
      ['osTerms', uri.OS_TERMS.uri]
    ])('uri tests', (linkKey, targetURL) => {
      it.each([
        ['?lang=cy', '\\?lang=cy'],
        ['?other-info=abc123&lang=cy', '\\?lang=cy'],
        ['?extra-info=123&extra-rods=2&lang=cy&cold-beer=yes-please', '\\?lang=cy'],
        ['', ''],
        ['?other-info=bbb-111', ''],
        ['?misc-data=999&extra-rods=1&marmite=no-thanks', '']
      ])(`appends Welsh language code to ${linkKey} link if necessary`, async (search, expectedQueryString) => {
        const request = {
          ...getMockRequest(),
          url: {
            search
          }
        }
        const data = await getData(request)
        expect(data.uri[linkKey]).toEqual(expect.stringMatching(`${targetURL}${expectedQueryString}`))
      })
    })
  })
})

const getMockRequest = (getCurrentPermission = () => ({})) => ({
  cache: () => ({
    helpers: {
      transaction: {
        getCurrentPermission
      }
    }
  }),
  url: {
    search: ''
  }
})

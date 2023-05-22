import { getData } from '../route'
import uri from '../../../../../uri.js'
import { addLanguageCodeToUri } from '../../../../../processors/uri-helper.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../uri.js', () => ({
  ADDRESS_LOOKUP: { uri: '/address/lookup' },
  ADDRESS_ENTRY: { uri: '/address/entry' },
  OS_TERMS: { uri: '/os/terms' }
}))
jest.mock('../../../../../routes/next-page.js', () => ({ nextPage: () => {} }))
jest.mock('../../../../../routes/page-route.js', () => () => {})
jest.mock('../../../../../processors/uri-helper.js', () => ({ addLanguageCodeToUri: jest.fn() }))
jest.mock('../../../../../processors/licence-type-display.js')

describe('address-lookup > route', () => {
  describe('getData', () => {
    beforeEach(jest.clearAllMocks)

    it('return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const result = await getData(getMockRequest(() => ({ concessions: [], isLicenceForYou: true })))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const result = await getData(getMockRequest(() => ({ concessions: [], isLicenceForYou: false })))
      expect(result.isLicenceForYou).toBeFalsy()
    })

    it('return isPhysical as true, if isPhysical is true for the permission', async () => {
      isPhysical.mockReturnValueOnce(true)
      const result = await getData(getMockRequest())
      expect(result.isPhysical).toBeTruthy()
    })

    it('return isPhysical as false, if isPhysical is false for the permission', async () => {
      isPhysical.mockReturnValueOnce(false)
      const result = await getData(getMockRequest())
      expect(result.isPhysical).toBeFalsy()
    })

    describe.each([
      ['entryPage', uri.ADDRESS_ENTRY.uri],
      ['osTerms', uri.OS_TERMS.uri]
    ])('uri tests', (linkKey, targetURL) => {
      it(`calls addLanguageCodeToUri with ${linkKey} url`, async () => {
        const mockRequest = getMockRequest()
        await getData(mockRequest)
        expect(addLanguageCodeToUri).toHaveBeenCalledWith(mockRequest, targetURL)
      })

      it('returns addLanguageCodeToUri value for uri', async () => {
        const mockRequest = getMockRequest()
        addLanguageCodeToUri.mockReturnValue(`here's your url: ${targetURL}, I hope you're happy`)

        const data = await getData(mockRequest)

        expect(data).toEqual(
          expect.objectContaining({
            uri: expect.objectContaining({
              [linkKey]: `here's your url: ${targetURL}, I hope you're happy`
            })
          })
        )
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

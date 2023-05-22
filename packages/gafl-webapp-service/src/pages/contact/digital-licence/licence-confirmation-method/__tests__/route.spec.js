import { CONTACT } from '../../../../../uri.js'
import { getData } from '../route.js'
import { isPhysical } from '../../../../../processors/licence-type-display.js'

jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('licence-confirmation-method > route', () => {
  describe('getData', () => {
    const getMockRequest = (options = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          transaction: {
            getCurrentPermission: jest.fn(() => ({
              licenceLength: options.licenceLength || '12M',
              licensee: {
                firstName: 'Lando',
                lastName: 'Norris'
              },
              isLicenceForYou: options.isLicenceForYou || false
            }))
          }
        }
      })),
      query: options.query || {}
    })

    beforeEach(jest.clearAllMocks)

    it('should reject and redirect to the contact page, if licence is not physical', async () => {
      isPhysical.mockReturnValueOnce(false)
      const func = async () => await getData(getMockRequest())
      await expect(func).rejects.toThrowRedirectTo(CONTACT.uri)
    })

    it('returns the expected data', async () => {
      expect(await getData(getMockRequest())).toMatchSnapshot()
    })

    describe('if change query is undefined,', () => {
      let result
      beforeEach(async () => {
        result = await getData(getMockRequest())
      })

      it("doesn't return changeEmail", async () => {
        expect(result.changeEmail).toBeUndefined()
      })

      it("doesn't return changeMobile", async () => {
        expect(result.changeMobile).toBeUndefined()
      })
    })

    it('if change query param is "email", returns changeEmail set to true', async () => {
      const result = await getData(getMockRequest({ query: { change: 'email' } }))
      expect(result.changeEmail).toBe(true)
    })

    it('if change query param is "mobile", returns changeMobile set to true', async () => {
      const result = await getData(getMockRequest({ query: { change: 'mobile' } }))
      expect(result.changeMobile).toBe(true)
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const result = await getData(getMockRequest({ isLicenceForYou: true }))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const result = await getData(getMockRequest({ isLicenceForYou: false }))
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})

import { CONTACT } from '../../../../../uri.js'
import { getData } from '../route.js'
import GetDataRedirect from '../../../../../handlers/get-data-redirect.js'

describe('licence-confirmation-method > route', () => {
  describe('getData', () => {
    const createRequestMock = (options = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          transaction: {
            getCurrentPermission: jest.fn(() => ({
              licenceLength: options.licenceLength || '12M',
              licensee: {
                firstName: 'Lando',
                lastName: 'Norris'
              },
              isLicenceForYou: options.isLicenceForYou || false,
              permit: {
                isForFulfilment: true
              }
            }))
          }
        }
      })),
      query: options.query || {}
    })

    const createRequestMockFalse = (options = {}) => ({
      cache: jest.fn(() => ({
        helpers: {
          transaction: {
            getCurrentPermission: jest.fn(() => ({
              licenceLength: options.licenceLength || '12M',
              licensee: {
                firstName: 'Lando',
                lastName: 'Norris'
              },
              isLicenceForYou: options.isLicenceForYou || false,
              permit: {
                isForFulfilment: false
              }
            }))
          }
        }
      })),
      query: options.query || {}
    })

    beforeEach(jest.clearAllMocks)

    it('should reject and redirect to the contact page, if licence is not physical', async () => {
      const getDataRedirectError = new GetDataRedirect(CONTACT.uri)
      const func = async () => await getData(createRequestMockFalse({ licenceLength: '1D' }))
      await expect(func).rejects.toThrow(getDataRedirectError)
    })

    it('returns the expected data', async () => {
      expect(await getData(createRequestMock())).toMatchSnapshot()
    })

    describe('if change query is undefined,', () => {
      let result
      beforeEach(async () => {
        result = await getData(createRequestMock())
      })

      it("doesn't return changeEmail", async () => {
        expect(result.changeEmail).toBeUndefined()
      })

      it("doesn't return changeMobile", async () => {
        expect(result.changeMobile).toBeUndefined()
      })
    })

    it('if change query param is "email", returns changeEmail set to true', async () => {
      const result = await getData(createRequestMock({ query: { change: 'email' } }))
      expect(result.changeEmail).toBe(true)
    })

    it('if change query param is "mobile", returns changeMobile set to true', async () => {
      const result = await getData(createRequestMock({ query: { change: 'mobile' } }))
      expect(result.changeMobile).toBe(true)
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const result = await getData(createRequestMock({ isLicenceForYou: true }))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const result = await getData(createRequestMock({ isLicenceForYou: false }))
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})

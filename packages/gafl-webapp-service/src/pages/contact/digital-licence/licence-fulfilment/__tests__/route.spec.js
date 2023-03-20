import { getData } from '../route'
import { CONTACT } from '../../../../../uri'
import { isPhysical } from '../../../../../processors/licence-type-display.js'
jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))

describe('licence-fulfilment > route', () => {
  const getMockRequest = (permission = {}) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => permission
        }
      }
    })
  })

  describe('getData', () => {
    beforeEach(jest.clearAllMocks)

    it('should throw an error if the licence is not physical', async () => {
      isPhysical.mockReturnValueOnce(false)
      const func = async () => await getData(getMockRequest())
      await expect(func).rejects.toThrowRedirectTo(CONTACT.uri)
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const permission = { licenceLength: '12M', isLicenceForYou: true }
      const result = await getData(getMockRequest(permission))
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const permission = { licenceLength: '12M', isLicenceForYou: false }
      const result = await getData(getMockRequest(permission))
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})

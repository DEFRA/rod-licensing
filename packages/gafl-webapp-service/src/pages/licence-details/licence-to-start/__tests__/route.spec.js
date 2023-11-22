import { getData } from '../route'

jest.mock('../../../../processors/uri-helper.js')

describe('licence-to-start > route', () => {
  const getMockRequest = (isLicenceForYou = true) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: () => ({
            isLicenceForYou
          })
        }
      }
    })
  })

  describe('getData', () => {
    it('should return isLicenceForYou as true, if isLicenceForYou is true on the transaction cache', async () => {
      const request = getMockRequest()
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeTruthy()
    })

    it('should return isLicenceForYou as false, if isLicenceForYou is false on the transaction cache', async () => {
      const request = getMockRequest(false)
      const result = await getData(request)
      expect(result.isLicenceForYou).toBeFalsy()
    })
  })
})

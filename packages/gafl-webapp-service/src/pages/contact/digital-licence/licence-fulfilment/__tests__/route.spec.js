import { getData } from '../route'
import { CONTACT } from '../../../../../uri'
import { isPhysical } from '../../../../../processors/licence-type-display.js'
import { youOrOther } from '../../../../../processors/message-helper.js'

jest.mock('../../../../../processors/licence-type-display.js', () => ({
  isPhysical: jest.fn(() => true)
}))
jest.mock('../../../../../processors/message-helper.js')

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

    it('should call youOrOther with the permission', async () => {
      const permission = Symbol('permission')
      await getData(getMockRequest(permission))
      expect(youOrOther).toHaveBeenCalledWith(permission)
    })

    it('should use the value returned by youOrOther', async () => {
      const returnedValue = Symbol('value')
      youOrOther.mockReturnValueOnce(returnedValue)

      const result = await getData(getMockRequest())
      expect(result.youOrOther).toEqual(returnedValue)
    })

    it.each([
      ['true', true],
      ['false', false],
      [undefined, false]
    ])('SHOW_NOTIFICATION_BANNER is set to value of process.env.SHOW_NOTIFICATION_BANNER', async (notification, expectedResult) => {
      process.env.SHOW_NOTIFICATION_BANNER = notification
      const mockRequest = getMockRequest()
      const result = await getData(mockRequest)

      expect(result.SHOW_NOTIFICATION_BANNER).toEqual(expectedResult)
    })
  })
})

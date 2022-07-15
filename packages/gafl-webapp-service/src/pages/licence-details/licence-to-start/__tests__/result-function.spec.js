import resultFunction, { licenceToStartResults } from '../result-function'
import { ageConcessionResults } from '../../../concessions/date-of-birth/result-function.js'
import { isMultibuyForYou } from '../../../../handlers/multibuy-for-you-handler.js'

import CommonResultHandler from '../../../../handlers/multibuy-amend-handler.js'

jest.mock('../../../../handlers/multibuy-amend-handler.js', () => jest.fn(() => {}))

jest.mock('../../../../handlers/multibuy-for-you-handler.js', () => ({
  isMultibuyForYou: jest.fn()
}))

jest.mock('../update-transaction.js', () => ({
  licenceToStart: {
    ANOTHER_DATE: 'some future date'
  }
}))

describe('licence-to-start > result-function', () => {
  const getMockRequest = (licenceStartTimeNeeded, licenceLengthAmount) => ({
    cache: () => ({
      helpers: {
        transaction: {
          getCurrentPermission: async () => ({
            licenceToStart: licenceStartTimeNeeded,
            licenceLength: licenceLengthAmount,
            licensee: {
              noLicenceRequired: true
            }
          })
        }
      }
    })
  })

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    it('should return the value of common result handler', async () => {
      const commonResult = Symbol('Common Result')
      CommonResultHandler.mockReturnValue(commonResult)
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(commonResult)
    })

    it('should pass request object to common result handler', async () => {
      const request = getMockRequest()
      await resultFunction(request)
      expect(CommonResultHandler).toHaveBeenCalledWith(request)
    })

    it('should pass request object to is multibuy for you handler', async () => {
      const request = getMockRequest()
      await resultFunction(request)
      expect(isMultibuyForYou).toHaveBeenCalledWith(request)
    })

    it('should return licenceToStartResults.AND_START_TIME if not 12 months lengths and licence to start is another date', async () => {
      isMultibuyForYou.mockImplementationOnce(() => true)
      const result = await resultFunction(getMockRequest('some future date', '8D'))
      expect(result).toBe(licenceToStartResults.AND_START_TIME)
    })

    it('should return ageConcessionResults.NO_LICENCE_REQUIRED if no licence is required', async () => {
      isMultibuyForYou.mockImplementationOnce(() => false)
      const result = await resultFunction(getMockRequest())
      expect(result).toBe(ageConcessionResults.NO_LICENCE_REQUIRED)
    })
  })
})

import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('newsletter > result-function', () => {
  const getMockRequest = fromContactDetailsSeen => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => ({
            fromContactDetailsSeen: fromContactDetailsSeen
          })
        }
      }
    })
  })

  describe('result function', () => {
    beforeEach(jest.clearAllMocks)

    it('should return amend if status.fromContactDetailsSeen equals seen', async () => {
      const result = await resultFunction(getMockRequest('seen'))
      expect(result).toBe(CommonResults.AMEND)
    })

    it.each([['not-seen'], ['fail'], [false]])(
      'should return ok if status.fromContactDetailsSeen does not equal seen',
      async fromContactDetailsSeen => {
        const result = await resultFunction(getMockRequest(fromContactDetailsSeen))
        expect(result).toBe(CommonResults.OK)
      }
    )
  })
})

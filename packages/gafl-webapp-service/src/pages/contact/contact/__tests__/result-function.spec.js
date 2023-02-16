import resultFunction from '../result-function'
import { CommonResults } from '../../../../constants.js'

describe('contact > result-function', () => {
  const getMockRequest = (statusGet = () => {}, transactionGet = () => {}) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => statusGet
        },
        transaction: {
          getCurrentPermission: async () => transactionGet
        }
      }
    })
  })

  describe('default', () => {
    beforeEach(jest.clearAllMocks)

    describe('contact details seen', () => {
      it('should return amend if contact details have been seen', async () => {
        const status = {
          fromContactDetailsSeen: 'seen'
        }
        const result = await resultFunction(getMockRequest(status))
        expect(result).toBe(CommonResults.AMEND)
      })
    })

    describe('contact details not seen', () => {
      const status = {
        fromContactDetailsSeen: 'not-seen'
      }

      it('should return ok if licence is for you', async () => {
        const transaction = {
          isLicenceForYou: true
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.OK)
      })

      it('should return summary if licence is not for you', async () => {
        const transaction = {
          isLicenceForYou: false
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.SUMMARY)
      })

      it('should return ok if not been contact summary', async () => {
        const transaction = {
          isLicenceForYou: true,
          fromSummary: 'fake-summary'
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.OK)
      })

      it('should return summary if been too contactmsummary', async () => {
        const transaction = {
          fromSummary: 'contact-summary'
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.SUMMARY)
      })

      it('should return ok if not a renewal', async () => {
        const transaction = {
          isLicenceForYou: true,
          isRenewal: false
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.OK)
      })

      it('should return summary if is a renewal', async () => {
        const transaction = {
          isRenewal: true
        }
        const result = await resultFunction(getMockRequest(status, transaction))
        expect(result).toBe(CommonResults.SUMMARY)
      })
    })
  })
})

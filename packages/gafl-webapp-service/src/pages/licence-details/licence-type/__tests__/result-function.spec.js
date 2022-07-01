import { hasJunior } from '../../../../processors/concession-helper'
import resultFunction from '../result-function'

jest.mock('../../../../processors/concession-helper.js', () => ({
  hasJunior: jest.fn()
}))

describe('licence-type > result-function', () => {
  describe('default', () => {
    const mockTransactionCacheGet = jest.fn()
    const mockStatusCacheGet = jest.fn()
    const mockRequest = {
      cache: () => ({
        helpers: {
          transaction: {
            getCurrentPermission: mockTransactionCacheGet
          },
          status: {
            getCurrentPermission: mockStatusCacheGet
          }
        }
      })
    }
    it.each([
      ['seen', false, 'amend'],
      [false, 'seen', 'summary']
    ])(
      'should return correct route direction if from licence options or summary page',
      async (licenceOptionsSeen, summarySeen, expectedResult) => {
        mockTransactionCacheGet.mockImplementationOnce(() => ({}))
        mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: licenceOptionsSeen, fromSummary: summarySeen }))
        const result = await resultFunction(mockRequest)
        expect(result).toBe(expectedResult)
      }
    )

    it('should return to skip licence length if the licensee has junior', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: false, fromSummary: false }))
      hasJunior.mockReturnValueOnce('junior')
      const result = await resultFunction(mockRequest)
      expect(result).toBe('skip-length')
    })

    it('should return to skip licence length if the licence is 3 rods trout-and-coarse', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({ licenceType: 'Trout and coarse', numberOfRods: '3' }))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: false, fromSummary: false }))
      hasJunior.mockReturnValueOnce(false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe('skip-length')
    })

    it('should return ask licence length if the licensee requires a licence', async () => {
      mockTransactionCacheGet.mockImplementationOnce(() => ({}))
      mockStatusCacheGet.mockImplementationOnce(() => ({ fromLicenceOptions: false, fromSummary: false }))
      hasJunior.mockReturnValueOnce(false)
      const result = await resultFunction(mockRequest)
      expect(result).toBe('ask-length')
    })
  })
})

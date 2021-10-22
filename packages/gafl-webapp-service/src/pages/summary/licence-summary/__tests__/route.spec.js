import { getFromSummary } from '../route'
import { LICENCE_SUMMARY_SEEN, CONTACT_SUMMARY_SEEN } from '../../../../constants.js'

describe('licence-summary > route', () => {
  describe('getFromSummary', () => {
    it('should return licence-summary, if it is a renewal', async () => {
      const request = { renewal: true }
      const result = await getFromSummary(request)
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should return licence-summary, if fromSummary has not been set and it is not a renewal', async () => {
      const result = await getFromSummary({})
      expect(result).toBe(LICENCE_SUMMARY_SEEN)
    })

    it('should set fromSummary to contact-summary, if fromSummary is contact-summary and it is not a renewal', async () => {
      const request = { fromSummary: CONTACT_SUMMARY_SEEN }
      const result = await getFromSummary(request)
      expect(result).toBe(CONTACT_SUMMARY_SEEN)
    })
  })
})

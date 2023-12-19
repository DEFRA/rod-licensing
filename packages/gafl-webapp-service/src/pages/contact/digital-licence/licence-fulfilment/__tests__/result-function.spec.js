import resultFunction from '../result-function.js'
import constants from '../../../../../constants.js'

jest.mock('../../../../../constants', () => ({
  CONTACT_SUMMARY_SEEN: 'contact-summary-seen',
  CommonResults: {
    SUMMARY: 'Summary-common-result',
    OK: 'Summary-common-result'
  }
}))

describe('licence summary result function', () => {
  const getMockRequest = (fromSummary = constants.CONTACT_SUMMARY_SEEN) => ({
    cache: () => ({
      helpers: {
        status: {
          getCurrentPermission: async () => ({
            fromSummary
          })
        }
      }
    })
  })

  it('returns summary result if contact summary is requested', async () => {
    const result = await resultFunction(getMockRequest())
    expect(result).toBe(constants.CommonResults.SUMMARY)
  })

  it("returns ok result if contact summary isn't requested", async () => {
    const result = await resultFunction(getMockRequest('not-contact-summary'))
    expect(result).toBe(constants.CommonResults.OK)
  })
})
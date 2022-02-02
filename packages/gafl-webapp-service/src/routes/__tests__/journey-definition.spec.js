import journeyDefinition from '../journey-definition.js'
import { BUY_OR_RENEW, LICENCE_SUMMARY } from '../../uri.js'
describe('back links', () => {
  it('goes from BUY_OR_RENEW to LICENCE_SUMMARY when there\'s a fromSummary', () => {
    const licenceForJourneyDefinition = journeyDefinition.find(jd => jd.current === BUY_OR_RENEW)
    const link = licenceForJourneyDefinition.backLink({ fromSummary: {} })
    expect(link).toEqual(LICENCE_SUMMARY.uri)
  })
})

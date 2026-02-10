import { CommonResults } from '../../constants.js'
import { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE } from '../../uri.js'
import journeyDefinition from '../journey-definition.js'

describe('journey-definition cancel confirm transition', () => {
  it('maps CANCEL_RP_CONFIRM + OK to CANCEL_RP_COMPLETE', () => {
    const entry = journeyDefinition.find(page => page.current.page === CANCEL_RP_CONFIRM.page)
    expect(entry.next[CommonResults.OK].page).toBe(CANCEL_RP_COMPLETE)
  })
})

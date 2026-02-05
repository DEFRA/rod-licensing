describe('journey-definition cancel confirm transition', () => {
  it('maps CANCEL_RP_CONFIRM + OK to CANCEL_RP_COMPLETE', () => {
    jest.isolateModules(() => {
      const { CommonResults } = require('../../constants.js')
      const { CANCEL_RP_CONFIRM, CANCEL_RP_COMPLETE } = require('../../uri.js')
      const journeyDefinition = require('../journey-definition.js').default

      const entry = journeyDefinition.find(page => page.current.page === CANCEL_RP_CONFIRM.page)
      expect(entry.next[CommonResults.OK].page).toBe(CANCEL_RP_COMPLETE)
    })
  })
})

import * as connectors from '../connectors.js'
describe('connectors', () => {
  it('exposes aws connectors', () => {
    expect(connectors.AWS).toBeInstanceOf(Function)
  })
})

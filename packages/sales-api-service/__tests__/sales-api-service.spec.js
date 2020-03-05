import EntryPointExport from '../src/sales-api-service.js'
describe('sales-api-service', () => {
  it('returns a promise that will start the hapi server', async () => {
    expect(EntryPointExport).toBeInstanceOf(Promise)
    const server = await EntryPointExport
    expect(server.stop).toBeDefined()
    await server.stop()
    expect(server.info.started).toEqual(0)
  })
})

import '@defra-fish/dynamics-lib'

describe('executeWithErrorLog', () => {
  it('logs the filter when executeQuery fails via the handler', async () => {
    jest.resetModules()

    const debugSpy = jest.fn()
    jest.doMock('debug', () => jest.fn(() => debugSpy))

    jest.doMock('@defra-fish/dynamics-lib', () => {
      const actual = jest.requireActual('@defra-fish/dynamics-lib')
      return {
        ...actual,
        executeQuery: jest.fn().mockRejectedValueOnce(new Error('boom')),
        contactForLicenseeNoReference: jest.fn(() => ({ filter: 'query filter test' })),
        permissionForContacts: jest.fn(() => [])
      }
    })

    const authenticate = (await import('../authenticate.js')).default
    const [
      {
        options: { handler }
      }
    ] = authenticate

    const request = {
      query: { licenseeBirthDate: '', licenseePostcode: '' },
      params: { referenceNumber: '' }
    }
    const h = { response: () => ({ code: () => {} }) }

    await handler(request, h).catch(() => {})

    expect(debugSpy).toHaveBeenCalledWith('Error executing query with filter query filter test')
  })
})

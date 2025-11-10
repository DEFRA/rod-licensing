import { contactForLicenseeNoReference, executeQuery } from '@defra-fish/dynamics-lib'

describe('executeWithErrorLog', () => {
  const arrangeExecuteWithErrorLog = async () => {
    jest.resetModules()

    const logSpy = jest.fn()
    jest.doMock('debug', () => jest.fn(() => logSpy))

    jest.doMock('@defra-fish/dynamics-lib', () => {
      const actual = jest.requireActual('@defra-fish/dynamics-lib')
      return {
        ...actual,
        executeQuery: jest.fn().mockImplementationOnce(() => Promise.reject(new Error('oopsie')))
      }
    })

    const { errorLogTest } = await import('../authenticate.js')
    return { logSpy, executeWithErrorLog: errorLogTest.executeWithErrorLog }
  }

  it('rejects when executeQuery fails', async () => {
    const { executeWithErrorLog } = await arrangeExecuteWithErrorLog()
    await expect(executeWithErrorLog({ filter: 'query filter test' })).rejects.toThrow()
  })

  it('logs the filter on failure', async () => {
    const { executeWithErrorLog, logSpy } = await arrangeExecuteWithErrorLog()
    await executeWithErrorLog({ filter: 'query filter test' }).catch(() => {})
    expect(logSpy).toHaveBeenCalledWith('Error executing query with filter query filter test')
  })
})

describe('executeWithErrorLog via handler', () => {
  const arrangeHandler = async () => {
    jest.resetModules()

    const logSpy = jest.fn()
    jest.doMock('debug', () => jest.fn(() => logSpy))

    jest.doMock('@defra-fish/dynamics-lib', () => {
      const actual = jest.requireActual('@defra-fish/dynamics-lib')
      return {
        ...actual,
        executeQuery: jest.fn().mockImplementationOnce(() => Promise.reject(new Error('oopsie'))),
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

    return { logSpy, handler }
  }

  it('bubbles the error from executeQuery', async () => {
    const { handler } = await arrangeHandler()
    const request = {
      query: { licenseeBirthDate: '2000-01-01', licenseePostcode: 'AB12 3CD' },
      params: { referenceNumber: 'CD379B' }
    }
    const h = { response: () => ({ code: () => {} }) }

    await expect(handler(request, h)).rejects.toThrow('oopsie')
  })

  it('logs the filter when executeQuery fails', async () => {
    const { handler, logSpy } = await arrangeHandler()
    const request = {
      query: { licenseeBirthDate: '2000-01-01', licenseePostcode: 'AB12 3CD' },
      params: { referenceNumber: 'CD379B' }
    }
    const h = { response: () => ({ code: () => {} }) }

    await handler(request, h).catch(() => {})

    expect(logSpy).toHaveBeenCalledWith('Error executing query with filter query filter test')
  })
})

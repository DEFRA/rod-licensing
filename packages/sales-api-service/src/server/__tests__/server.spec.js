import initialiseServer from '../server.js'
import Boom from '@hapi/boom'
import dotProp from 'dot-prop'
import { SERVER } from '../../config.js'
import fs from 'fs'

jest.mock('fs', () => {
  const actual = jest.requireActual('fs')
  return {
    ...actual,
    readFileSync: jest.fn(() => JSON.stringify({ name: 'sales-api-test', version: '1.2.3' }))
  }
})

describe('hapi server', () => {
  describe('initialisation', () => {
    const serverInfoUri = 'test'
    let serverConfigSpy
    beforeAll(() => {
      const Hapi = jest.requireActual('@hapi/hapi')
      serverConfigSpy = jest.spyOn(Hapi, 'Server').mockImplementation(() => ({
        ext: jest.fn(),
        start: jest.fn(),
        stop: jest.fn(),
        register: jest.fn(),
        route: jest.fn(),
        info: {
          uri: serverInfoUri
        },
        listener: {}
      }))
    })
    beforeEach(jest.clearAllMocks)

    afterAll(jest.restoreAllMocks)

    it('uses port 4000 if no port is specified', async () => {
      await initialiseServer()
      expect(serverConfigSpy).toHaveBeenCalledWith(expect.objectContaining({ port: 4000 }))
    })

    it('starts on a configured port', async () => {
      await initialiseServer({ port: 6666 })
      expect(serverConfigSpy).toHaveBeenCalledWith(expect.objectContaining({ port: 6666 }))
    })

    it('starts on a port defined by the environment', async () => {
      SERVER.Port = 6666
      await initialiseServer()
      expect(serverConfigSpy).toHaveBeenCalledWith(expect.objectContaining({ port: 6666 }))
    })

    it('customises the keep-alive timeout settings if defined in the environment', async () => {
      SERVER.KeepAliveTimeout = 123
      await initialiseServer()
      expect(serverConfigSpy.mock.results[0].value.listener).toEqual({
        keepAliveTimeout: 123,
        headersTimeout: 5123
      })
    })

    it('logs startup details including name and version', async () => {
      const mockPkg = { name: 'sales-api-test', version: '1.2.3' }
      fs.readFileSync.mockReturnValue(JSON.stringify(mockPkg))
      const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})

      await initialiseServer({ port: 4000 })

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Server started at %s. Listening on %s. name: %s. version: %s'),
        expect.any(String),
        serverInfoUri,
        mockPkg.name,
        mockPkg.version
      )
    })
  })

  describe('configuration', () => {
    let server = null
    beforeAll(async () => {
      server = await initialiseServer({ port: null })
    })
    afterAll(async () => server.stop())

    it('configures a route payload failAction resolving to a 422 Unprocessable Entity error for payload errors', async () => {
      expect(server.settings.routes.validate.failAction).toBeInstanceOf(Function)
      const testError = new Error('Test')
      dotProp.set(testError, 'output.payload.validation.source', 'payload')
      await expect(server.settings.routes.validate.failAction(null, null, testError)).resolves.toEqual(
        Boom.badData('Invalid payload: Test')
      )
    })

    it('configures a route payload failAction resolving to a 400 Bad Request error for payload errors', async () => {
      expect(server.settings.routes.validate.failAction).toBeInstanceOf(Function)
      const testError = new Error('Test')
      dotProp.set(testError, 'output.payload.validation.source', 'params')
      await expect(server.settings.routes.validate.failAction(null, null, testError)).resolves.toEqual(
        Boom.badRequest('Invalid params: Test')
      )
    })

    it('implements an onPreResponse handler to capture errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      const result = await server.inject({ method: 'GET', url: '/permits', simulate: { error: true } })

      expect(JSON.parse(result.payload)).toMatchObject(
        expect.objectContaining({
          statusCode: 500,
          error: 'Internal Server Error',
          message: expect.any(String)
        })
      )
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error processing request. Request: %j, Exception: %o',
        expect.objectContaining({ path: expect.any(String), params: expect.anything(), payload: undefined, query: expect.anything() }),
        expect.any(Error)
      )
    })

    describe.each([
      ['SIGINT', 130],
      ['SIGTERM', 137]
    ])('implements a shutdown handler to respond to the %s signal', (signal, code) => {
      it('shuts down the hapi server and exits the process', done => {
        const serverStopSpy = jest.spyOn(server, 'stop').mockImplementation(jest.fn())
        const processStopSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.emit(signal)
        setImmediate(async () => {
          expect(serverStopSpy).toHaveBeenCalled()
          expect(processStopSpy).toHaveBeenCalledWith(code)
          jest.restoreAllMocks()
          await server.stop()
          done()
        })
      })
    })

    it('exposes a landing page', async () => {
      const result = await server.inject({ method: 'GET', url: '/' })
      expect(result).toMatchObject({
        statusCode: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8'
        }
      })
    })
  })
})

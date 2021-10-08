import { Notifier } from '@airbrake/node'
import * as airbrake from '../airbrake.js'
jest.mock('@airbrake/node')

const nativeConsoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
const nativeConsoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(jest.fn())

expect.extend({
  errorWithMessageMatching (received, ...matchers) {
    try {
      expect(received).toBeInstanceOf(Error)
      for (const matcher of matchers) {
        if (!matcher.asymmetricMatch(received.message)) {
          return { message: () => `expected ${matcher.toString()} to pass`, pass: false }
        }
      }
      return { pass: true }
    } catch (e) {
      return { message: () => e.message, pass: false }
    }
  }
})

describe.skip('airbrake', () => {
  beforeEach(jest.resetAllMocks)

  it('does not initialise airbrake if the required environment variables are missing', done => {
    jest.isolateModules(async () => {
      try {
        delete process.env.AIRBRAKE_HOST
        delete process.env.AIRBRAKE_PROJECT_KEY
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(false)
        console.error(new Error('Test'))
        await expect(airbrake.flush()).resolves.toBeUndefined()
        expect(Notifier.prototype.notify).not.toHaveBeenCalled()
        expect(Notifier.prototype.flush).not.toHaveBeenCalled()
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('initialises airbrake if the required environment variables are present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)
        const testError = new Error('Test')
        console.error(testError)
        await expect(airbrake.flush()).resolves.toBeUndefined()
        expect(Notifier.prototype.notify).toHaveBeenCalledWith(expect.objectContaining({ error: testError }))
        expect(Notifier.prototype.flush).toHaveBeenCalled()
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('intercepts console.warn and console.error calls and notifies airbrake', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        process.env.name = 'Test PM2 process name'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        console.error('An error')
        expect(nativeConsoleErrorSpy).toHaveBeenLastCalledWith('An error')
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('An error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: { 0: "'An error'" },
              method: 'error'
            }
          }),
          context: {},
          environment: {
            name: 'Test PM2 process name'
          }
        })
        console.warn('A warning')
        expect(nativeConsoleWarnSpy).toHaveBeenLastCalledWith('A warning')
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('A warning')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: { 0: "'A warning'" },
              method: 'warn'
            }
          }),
          context: {},
          environment: {
            name: 'Test PM2 process name'
          }
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  describe.each([
    [['A single string'], 'A single string'],
    [['A string with %d %s arguments', 2, 'formatting'], 'A string with 2 formatting arguments'],
    [['Test', 'multiple', 'strings', 'with', 'no', 'format'], 'Test multiple strings with no format'],
    [[new Error('Test error pos 1'), 'another string'], 'Test error pos 1'],
    [['another string', new Error('Test error pos 2')], 'Test error pos 2']
  ])('formats the error message in a consistent manner with the native console.error call: test %#', (input, output) => {
    it(`[${input}] === ${output}`, done => {
      jest.isolateModules(async () => {
        try {
          process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
          process.env.AIRBRAKE_PROJECT_KEY = '123'
          const airbrake = require('../airbrake.js')
          expect(airbrake.initialise()).toEqual(true)

          console.error(...input)
          expect(nativeConsoleErrorSpy).toHaveBeenLastCalledWith(...input)
          expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
            error: expect.errorWithMessageMatching(expect.stringMatching(output)),
            params: expect.objectContaining({
              consoleInvocationDetails: {
                arguments: expect.any(Object),
                method: 'error'
              }
            }),
            context: {},
            environment: expect.any(Object)
          })
          done()
        } catch (e) {
          done(e)
        }
      })
    })
  })

  it('should output the request state in the session object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { state: { sid: 'abc123' }, headers: {} }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {},
          session: { sid: 'abc123' },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('should output the request path in the context object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { method: 'GET', path: '/path', headers: {} }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {
            action: 'GET /path'
          },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('should output the user agent in the context object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { headers: { 'user-agent': 'chrome' } }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {
            userAgent: 'chrome'
          },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it('hooks the process for uncaughtExceptions and unhandledRejections', done => {
    jest.isolateModules(async () => {
      try {
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const testError = new Error('Test error')
        process.emit('uncaughtExceptionMonitor', testError)
        process.emit('unhandledRejection', testError)

        process.nextTick(() => {
          expect(nativeConsoleErrorSpy).toHaveBeenLastCalledWith(testError)
          expect(Notifier.prototype.flush).toHaveBeenCalled()
          expect(processExitSpy).toHaveBeenCalledWith(1)
          done()
        })
      } catch (e) {
        done(e)
      }
    })
  })
})

describe('airbrake 2', () => {
  beforeEach(() => {
    process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
    process.env.AIRBRAKE_PROJECT_KEY = '123'
    jest.resetAllMocks()
    airbrake.reset()
  })

  it('does not initialise airbrake if the required environment variables are missing', async () => {
    delete process.env.AIRBRAKE_HOST
    delete process.env.AIRBRAKE_PROJECT_KEY
    expect(airbrake.initialise()).toEqual(false)
    console.error(new Error('Test'))
    await expect(airbrake.flush()).resolves.toBeUndefined()
    expect(Notifier.prototype.notify).not.toHaveBeenCalled()
    expect(Notifier.prototype.flush).not.toHaveBeenCalled()
  })

  it('initialises airbrake if the required environment variables are present', async () => {
    expect(airbrake.initialise()).toEqual(true)
    const testError = new Error('Test')
    console.error(testError)
    await expect(airbrake.flush()).resolves.toBeUndefined()
    expect(Notifier.prototype.notify).toHaveBeenCalledWith(expect.objectContaining({ error: testError }))
    expect(Notifier.prototype.flush).toHaveBeenCalled()
  })

  it('intercepts console.warn and console.error calls and notifies airbrake', () => {
    // we can't use it.each, as console.error and console.warn are scoped differently
    // outside of the test function passed to it...
    const cases = [
      ['error', console.error, 'An Error', nativeConsoleErrorSpy],
      ['warn', console.warn, 'A warning', nativeConsoleWarnSpy]
    ]
    process.env.name = 'Test PM2 process name'
    for (const [method, fnCall, message, spy] of cases) {
      airbrake.initialise()

      fnCall(message)
      expect(spy).toHaveBeenLastCalledWith(message)
      expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
        error: expect.errorWithMessageMatching(expect.stringMatching(message)),
        params: expect.objectContaining({
          consoleInvocationDetails: {
            arguments: { 0: `'${message}'` },
            method
          }
        }),
        context: {},
        environment: {
          name: 'Test PM2 process name'
        }
      })
    }
  })

  it.each([
    [['A single string'], 'A single string'],
    [['A string with %d %s arguments', 2, 'formatting'], 'A string with 2 formatting arguments'],
    [['Test', 'multiple', 'strings', 'with', 'no', 'format'], 'Test multiple strings with no format'],
    [[new Error('Test error pos 1'), 'another string'], 'Test error pos 1'],
    [['another string', new Error('Test error pos 2')], 'Test error pos 2']
  ])('formats the error message in a consistent manner with the native console.error call: [%j] === %s', async (input, output) => {
    airbrake.initialise()

    console.error(...input)
    expect(nativeConsoleErrorSpy).toHaveBeenLastCalledWith(...input)
    expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
      error: expect.errorWithMessageMatching(expect.stringMatching(output)),
      params: expect.objectContaining({
        consoleInvocationDetails: {
          arguments: expect.any(Object),
          method: 'error'
        }
      }),
      context: {},
      environment: expect.any(Object)
    })
  })

  it.skip('should output the request state in the session object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { state: { sid: 'abc123' }, headers: {} }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {},
          session: { sid: 'abc123' },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it.skip('should output the request path in the context object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { method: 'GET', path: '/path', headers: {} }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {
            action: 'GET /path'
          },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it.skip('should output the user agent in the context object if it is present', done => {
    jest.isolateModules(async () => {
      try {
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const requestDetail = { headers: { 'user-agent': 'chrome' } }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, {})
        expect(Notifier.prototype.notify).toHaveBeenLastCalledWith({
          error: expect.errorWithMessageMatching(expect.stringMatching('Error')),
          params: expect.objectContaining({
            consoleInvocationDetails: {
              arguments: expect.any(Object),
              method: 'error'
            }
          }),
          context: {
            userAgent: 'chrome'
          },
          environment: expect.any(Object)
        })
        done()
      } catch (e) {
        done(e)
      }
    })
  })

  it.skip('hooks the process for uncaughtExceptions and unhandledRejections', done => {
    jest.isolateModules(async () => {
      try {
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
        process.env.AIRBRAKE_HOST = 'https://test-airbrake.com'
        process.env.AIRBRAKE_PROJECT_KEY = '123'
        const airbrake = require('../airbrake.js')
        expect(airbrake.initialise()).toEqual(true)

        const testError = new Error('Test error')
        process.emit('uncaughtExceptionMonitor', testError)
        process.emit('unhandledRejection', testError)

        process.nextTick(() => {
          expect(nativeConsoleErrorSpy).toHaveBeenLastCalledWith(testError)
          expect(Notifier.prototype.flush).toHaveBeenCalled()
          expect(processExitSpy).toHaveBeenCalledWith(1)
          done()
        })
      } catch (e) {
        done(e)
      }
    })
  })
})

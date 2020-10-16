import { Notifier } from '@airbrake/node'
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

describe('airbrake', () => {
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
            environment: expect.any(Object)
          })
          done()
        } catch (e) {
          done(e)
        }
      })
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

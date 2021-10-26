import { Notifier } from '@airbrake/node'
import { formatWithOptions, inspect } from 'util'
const INSPECT_OPTS = { depth: null, maxStringLength: null, maxArrayLength: null, breakLength: null, compact: true, showHidden: true }

let airbrake = null

export const reset = () => {
  airbrake = null
}

/**
 * Initialise the airbrake client and intercept console.error and console.warn calls, notifying airbrake/errbit of any invocations.
 * If the required environment variables are not set then airbrake will not be initialised.
 *
 * @returns {boolean} true if the client was initialised, false otherwise.
 */
export const initialise = () => {
  if (!airbrake && process.env.AIRBRAKE_PROJECT_KEY && process.env.AIRBRAKE_HOST) {
    airbrake = new Notifier({
      projectId: 1,
      projectKey: process.env.AIRBRAKE_PROJECT_KEY,
      host: process.env.AIRBRAKE_HOST,
      environment: process.env.NODE_ENV,
      performanceStats: false
    })

    // Proxy the console.warn and console.error methods, notifying airbrake/errbit asynchronously
    const nativeConsoleMethods = {}
    ;['warn', 'error'].forEach(method => {
      nativeConsoleMethods[method] = console[method].bind(console)
      console[method] = (...args) => {
        const error = args.find(arg => arg instanceof Error) ?? new Error(formatWithOptions(INSPECT_OPTS, ...args))
        const request = args.find(arg => Object.prototype.hasOwnProperty.call(arg, 'headers'))
        airbrake.notify({
          error,
          params: { consoleInvocationDetails: { method, arguments: { ...args.map(arg => inspect(arg, INSPECT_OPTS)) } } },
          environment: {
            // Support for PM2 process.env.name
            ...(process.env.name && { name: process.env.name })
          },
          ...(request?.state && { session: request?.state }),
          context: {
            ...(request?.method && { action: `${request?.method?.toUpperCase()} ${request?.path}` }),
            ...(request?.headers?.['user-agent'] && { userAgent: request?.headers?.['user-agent'] })
          }
        })
        nativeConsoleMethods[method](...args)
      }
    })

    // Ensure uncaught exceptions/rejections are logged to the native console
    process.on('uncaughtExceptionMonitor', err => nativeConsoleMethods.error(err))

    // Override the @airbrake/node uncaughtException/unhandledRejection handlers with our own as errors were not flushing correctly.
    const flushAndDie = async () => {
      await airbrake.flush()
      process.exit(1)
    }
    process.on('uncaughtException', flushAndDie)
    process.on('unhandledRejection', flushAndDie)
  }
  return !!airbrake
}

/**
 * Flush the buffer ensuring that any data waiting to be sent to airbrake/errbit is sent before returning
 *
 * @returns {Promise<void>}
 */
export const flush = async () => {
  initialise() && (await airbrake.flush())
}

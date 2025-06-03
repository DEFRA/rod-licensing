import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Swagger from './plugins/swagger.js'
import HealthCheck from './plugins/health.js'
import Routes from './routes/index.js'
import Boom from '@hapi/boom'
import { SERVER } from '../config.js'
import moment from 'moment'
import { airbrake } from '@defra-fish/connectors-lib'

export default async (opts = { port: SERVER.Port }) => {
  airbrake.initialise()

  const server = new Hapi.Server(
    Object.assign(
      {
        host: '0.0.0.0',
        routes: {
          validate: {
            failAction: async (request, h, err) => {
              const handler = err.output.payload.validation.source === 'payload' ? Boom.badData : Boom.badRequest
              return handler(`Invalid ${err.output.payload.validation.source}: ${err.message}`)
            }
          }
        }
      },
      opts
    )
  )
  server.listener.keepAliveTimeout = SERVER.KeepAliveTimeout
  server.listener.headersTimeout = SERVER.KeepAliveTimeout + 5000 // must be greater than server.listener.keepAliveTimeout

  server.ext('onPreResponse', (request, h) => {
    const response = request.response
    if (response.isBoom) {
      if (response.isServer) {
        const requestDetail = { path: request.path, query: request.query, params: request.params, payload: request.payload }
        console.error('Error processing request. Request: %j, Exception: %o', requestDetail, response)
      }

      response.reformat(true)
      response.output.payload.data = response.data
    }
    return h.continue
  })

  await server.register([Inert, Vision, HealthCheck, Swagger])
  server.route(Routes)

  await server.start()
  console.log('Node version %s', process.version)
  console.log('Server started at %s. Listening on %s', moment().toISOString(), server.info.uri)

  const shutdown = async code => {
    await server.stop()
    await airbrake.flush()
    process.exit(code)
  }

  process.on('SIGINT', () => shutdown(130))
  process.on('SIGTERM', () => shutdown(137))
  return server
}

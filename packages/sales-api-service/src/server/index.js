import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Swagger from './plugins/swagger.js'
import HealthCheck from './plugins/health.js'
import Routes from './routes/index.js'
import Boom from '@hapi/boom'
import { SERVER } from '../config.js'
import moment from 'moment'

export default async (opts = { port: SERVER.Port }) => {
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
    if (response.isBoom && response.isServer) {
      console.error(response)
      response.reformat(true)
    }
    return h.continue
  })

  await server.register([Inert, Vision, HealthCheck, Swagger])
  server.route(Routes)

  await server.start()
  console.log('Server started at %s. Listening on %s', moment().toISOString(), server.info.uri)

  const shutdown = async (code = 0) => {
    await server.stop()
    process.exit(code)
  }

  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
  return server
}

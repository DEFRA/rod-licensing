import Hapi from '@hapi/hapi'
import Inert from '@hapi/inert'
import Vision from '@hapi/vision'
import Swagger from './plugins/swagger.js'
import HealthCheck from './plugins/health.js'
import Routes from './routes/index.js'

export default async (opts = { port: process.env.PORT || 3000 }) => {
  const server = new Hapi.Server(opts)
  await server.register([Inert, Vision, HealthCheck, Swagger])
  server.route(Routes)

  await server.start()
  console.log('Server running at:', server.info.uri)
  return server
}

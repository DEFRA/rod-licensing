import { createServer, init } from './server.js'

/**
 * Create and start the web-server (once)
 */
createServer({ port: 3000 })
init().catch(e => {
  console.error(e)
  process.exit()
})

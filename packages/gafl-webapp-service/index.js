'use strict'

/**
 * Start the hapi
 */
import { createServer, init } from './src/server.js'
createServer({ port: 3000 })
init()

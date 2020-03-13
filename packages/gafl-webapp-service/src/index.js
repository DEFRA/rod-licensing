'use strict'

/**
 * Start the hapi
 */
import { createServer, init } from './server.js'
createServer({ port: 3000 })
init()

'use strict'

/**
 * Start the hapi
 */
import { createServer, init } from './server.js'
createServer({ port: 3000, debug: { request: ['error'], log: ['error'] } })
init()

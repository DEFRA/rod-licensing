'use strict'

/**
 * Start the hapi
 */
import { createServer, init } from './src/server.js'
// import CatboxMemory from '@hapi/catbox-memory'
//
// createServer({
//   cache: [
//     {
//       provider: {
//         constructor: CatboxMemory
//       }
//     }
//   ]
// })
//

createServer()
init()

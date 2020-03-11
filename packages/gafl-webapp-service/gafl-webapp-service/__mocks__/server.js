'use strict'

/**
 * The mock hapi
 */
import Hapi from '@hapi/hapi'
import CatboxMemory from '@hapi/catbox-memory'

const server = Hapi.server({
  port: 3000,
  host: 'localhost',
  cache: [
    {
      name: 'hapi-cache',
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

export default server

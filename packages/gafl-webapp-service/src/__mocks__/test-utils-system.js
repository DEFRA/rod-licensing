import { createServer, init, server } from '../server.js'
import { SESSION_COOKIE_NAME_DEFAULT, CSRF_TOKEN_COOKIE_NAME_DEFAULT } from '../constants.js'
import { TEST_TRANSACTION, TEST_STATUS, GET_PRICING_TYPES, GET_PRICING_LENGTHS, LICENCE_LENGTH, LICENCE_TYPE } from '../uri.js'

import CatboxMemory from '@hapi/catbox-memory'
import { salesApi } from '@defra-fish/connectors-lib'
import mockPermits from './data/permits'
import mockPermitsConcessions from './data/permit-concessions'
import mockConcessions from './data/concessions'
import mockDefraCountries from './data/defra-country'
import { pricingDetail } from '../processors/pricing-summary'

process.env.SESSION_COOKIE_PASSWORD = 'A'.repeat(32)

createServer({
  cache: [
    {
      provider: {
        constructor: CatboxMemory
      }
    }
  ]
})

const start = async done => {
  server.events.on('start', () => {
    done()
  })

  // Add a helper route to expose the transaction cache
  server.route({
    method: 'GET',
    path: TEST_TRANSACTION.uri,
    handler: async request => request.cache().helpers.transaction.get()
  })

  server.route({
    method: 'GET',
    path: TEST_STATUS.uri,
    handler: async request => request.cache().helpers.status.get()
  })

  server.route({
    method: 'GET',
    path: GET_PRICING_TYPES.uri,
    handler: async request => pricingDetail(LICENCE_TYPE.page, await request.cache().helpers.transaction.getCurrentPermission())
  })

  server.route({
    method: 'GET',
    path: GET_PRICING_LENGTHS.uri,
    handler: async request => pricingDetail(LICENCE_LENGTH.page, await request.cache().helpers.transaction.getCurrentPermission())
  })

  // clear cache
  server.route({
    method: 'GET',
    path: '/buy/clear-cache',
    handler: async request => {
      await request.cache().clear()
      return 'ok'
    }
  })

  await init()
}

const stop = async done => {
  server.events.on('stop', () => {
    done()
  })
  server.stop()
}

const getCookies = response => {
  const cookies = {}
  response.headers['set-cookie'] &&
    response.headers['set-cookie'].forEach(cookie => {
      const parts = cookie.split(';')[0].match(/(.*?)=(.*)$/)
      cookies[parts[1].trim()] = parts[2].trim()
    })
  return cookies
}

const initialize = async done => {
  const data = await server.inject({
    method: 'GET',
    url: '/buy'
  })

  global.cookies = getCookies(data)

  done()
}

const injectWithCookies = async (method, url, payload = {}) => {
  if (method === 'POST') {
    Object.assign(payload, { [CSRF_TOKEN_COOKIE_NAME_DEFAULT]: global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT] })
  }
  return server.inject({
    method,
    url,
    payload,
    headers: {
      cookie: `${SESSION_COOKIE_NAME_DEFAULT}=${global.cookies.sid}; ${CSRF_TOKEN_COOKIE_NAME_DEFAULT}=${global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT]}`
    }
  })
}

const injectWithoutSessionCookie = async (method, url, payload = {}) => {
  Object.assign(payload, { [CSRF_TOKEN_COOKIE_NAME_DEFAULT]: global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT] })
  return server.inject({
    method,
    url,
    payload,
    headers: { cookie: `${CSRF_TOKEN_COOKIE_NAME_DEFAULT}=${global.cookies[CSRF_TOKEN_COOKIE_NAME_DEFAULT]}` }
  })
}

const mockSalesApi = () => {
  salesApi.permits.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermits)))
  salesApi.permitConcessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockPermitsConcessions)))
  salesApi.concessions.getAll = jest.fn(async () => new Promise(resolve => resolve(mockConcessions)))
  salesApi.countries.getAll = jest.fn(async () => new Promise(resolve => resolve(mockDefraCountries)))
}

export { start, stop, server, getCookies, initialize, injectWithCookies, injectWithoutSessionCookie, mockSalesApi }

/*
 * Decorators to make access to the session cache available as
 * simple setters and getters hiding the session key.
 *
 * The cache is divided into individually addressable contexts
 */
import db from 'debug'
const debug = db('cache')

const contexts = {
  page: 'page-context',
  transaction: 'transaction-context',
  status: 'status-context'
}

const cacheDecorator = sessionCookieName =>
  function () {
    const id = () => this.state[sessionCookieName].id

    return {
      initialize: async () => {
        debug(`Initialize cache: ${id()}`)
        const cache = Object.values(contexts).reduce((a, c) => ({ ...a, [c]: {} }), {})
        await this.server.app.cache.set(id(), cache)
      },

      get: async context => {
        if (!contexts[context]) {
          throw new Error('Expect context')
        }

        const cache = await this.server.app.cache.get(id())
        return cache ? cache[contexts[context]] : null
      },

      set: async (context, obj) => {
        if (!contexts[context]) {
          throw new Error('Expect context')
        }

        if (!obj || typeof obj !== 'object') {
          throw new Error('Expect object')
        }

        const cache = await this.server.app.cache.get(id())
        const contextCache = cache[contexts[context]]
        Object.assign(contextCache, obj)
        Object.assign(cache, { [contexts[context]]: contextCache })
        await this.server.app.cache.set(id(), cache)
      }
    }
  }

export { cacheDecorator, contexts }

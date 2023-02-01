/*
 * Decorators to make access to the session cache available as
 * functions hiding the session key.
 *
 * These functions wrap the functions in ./cache-manager.js
 */
import { contexts, base, contextCache, CacheError } from './cache-manager.js'
import db from 'debug'
const debug = db('webapp:cache')

/**
 * Permissions functions. These operate on a given cache context for the currently set permission
 * @param serverCache - the catbox cache wrapper object bound to the server
 * @param context - a cache context e.g. 'page'
 * @param id - the session cookie id function
 * @param idx - the current permission index function
 * @returns - cache operations on each context
 */
const cacheOfCurrentPermissionAndContext = (serverCache, context, id, idx) => ({
  get: async () => contextCache(serverCache, id(), context).get(),
  set: async obj => contextCache(serverCache, id(), context).set(obj),

  hasPermission: async () => {
    const cache = await contextCache(serverCache, id(), context).get()
    return !!cache.permissions.length
  },

  setCurrentPermission: async data => {
    const cache = await contextCache(serverCache, id(), context).get()
    const current = cache.permissions[await idx(serverCache)]
    Object.assign(current, data)
    await contextCache(serverCache, id(), context).set(cache)
  },

  getCurrentPermission: async () => {
    const cache = await contextCache(serverCache, id(), context).get()
    return cache.permissions[await idx(serverCache)]
  }
})

/**
 * These functions are exposed on the request object and may be used by the handlers
 * @param sessionCookieName
 * @returns - cache decorator functions
 */
const cacheDecorator = sessionCookieName =>
  function () {
    /**
     * The cookie id
     * @returns {*}
     */
    const id = () => {
      if (!this.state || !this.state[sessionCookieName]) {
        throw new CacheError()
      }

      return this.state[sessionCookieName].id
    }

    /**
     * The current permission index
     * @param appCache
     * @returns {Promise<number>}
     */
    const idx = async appCache => {
      const status = await contextCache(appCache, id(), 'status').get()
      return status.currentPermissionIdx
    }

    return {
      getId: () => id(),

      // hasSession: () => !!this.state[sessionCookieName],

      initialize: async () => {
        debug(`Initializing cache for key: ${id()}`)
        const cache = Object.values(contexts).reduce((a, c) => ({ ...a, [c.identifier]: c.initializer }), {})
        await base(this.server.app.cache, id()).init(cache)
      },

      clear: async () => {
        debug(`Clearing cache for key: ${id()}`)
        await base(this.server.app.cache, id()).clear()
      },

      helpers: {
        transaction: cacheOfCurrentPermissionAndContext(this.server.app.cache, 'transaction', id, idx),
        status: cacheOfCurrentPermissionAndContext(this.server.app.cache, 'status', id, idx),
        addressLookup: cacheOfCurrentPermissionAndContext(this.server.app.cache, 'addressLookup', id, idx),
        analytics: {
          get: async () => contextCache(this.server.app.cache, id(), 'analytics').get(),
          set: async obj => contextCache(this.server.app.cache, id(), 'analytics').set(obj)
        },

        // This one differs in that it has an individual segment for each page
        page: {
          get: async () => contextCache(this.server.app.cache, id(), 'page').get(),
          set: async obj => contextCache(this.server.app.cache, id(), 'page').set(obj),

          setCurrentPermission: async (page, data) => {
            const pages = await contextCache(this.server.app.cache, id(), 'page').get()

            // This covers off the scenario where the cache has unexpectedly expired
            if (!pages) {
              throw new CacheError()
            }
            const currentPermission = pages.permissions[await idx(this.server.app.cache)]
            Object.assign(currentPermission, { [page]: data })
            await contextCache(this.server.app.cache, id(), 'page').set(pages)
          },

          getCurrentPermission: async page => {
            const pages = await contextCache(this.server.app.cache, id(), 'page').get()
            return pages.permissions[await idx(this.server.app.cache)][page]
          }
        }
      }
    }
  }

export { cacheDecorator }

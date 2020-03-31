/*
 * Decorators to make access to the session cache available as
 * functions hiding the session key.
 *
 * The cache is divided into individually addressable contexts
 */
import { contexts, base, contextCache, CacheError } from './cache-manager.js'
import db from 'debug'
/**
 * The cache is divided into individually addressable contexts
 */
const debug = db('cache')

/**
 * These functions are exposed on the request object and may be used by the handlers
 * @param sessionCookieName
 * @returns - cache decorator functions
 */
const cacheDecorator = sessionCookieName =>
  function () {
    const id = () => {
      if (!this.state[sessionCookieName]) {
        throw new CacheError()
      }

      return this.state[sessionCookieName].id
    }

    const idx = async appCache => {
      const status = await contextCache(appCache, id(), 'status').get()
      return status.currentPermissionIdx
    }

    return {
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
        transaction: {
          get: async () => contextCache(this.server.app.cache, id(), 'transaction').get(),
          set: async obj => contextCache(this.server.app.cache, id(), 'transaction').set(obj),

          hasPermission: async () => {
            const transaction = await contextCache(this.server.app.cache, id(), 'transaction').get()
            return !!transaction.permissions.length
          },

          setCurrentPermission: async permission => {
            const transaction = await contextCache(this.server.app.cache, id(), 'transaction').get()
            const current = transaction.permissions[await idx(this.server.app.cache)]
            Object.assign(current, permission)
            await contextCache(this.server.app.cache, id(), 'transaction').set(transaction)
          },

          getCurrentPermission: async () => {
            const transaction = await contextCache(this.server.app.cache, id(), 'transaction').get()
            return transaction.permissions[await idx(this.server.app.cache)]
          }
        },

        status: {
          get: async () => contextCache(this.server.app.cache, id(), 'status').get(),
          set: async obj => contextCache(this.server.app.cache, id(), 'status').set(obj),

          setCurrentPermission: async data => {
            const status = await contextCache(this.server.app.cache, id(), 'status').get()
            const current = status.permissions[status.currentPermissionIdx]
            Object.assign(current, data)
            await contextCache(this.server.app.cache, id(), 'status').set(status)
          },

          getCurrentPermission: async () => {
            const status = await contextCache(this.server.app.cache, id(), 'status').get()
            return status.permissions[status.currentPermissionIdx]
          }
        },

        page: {
          get: async () => contextCache(this.server.app.cache, id(), 'page').get(),
          set: async obj => contextCache(this.server.app.cache, id(), 'page').set(obj),

          setCurrentPermission: async (page, data) => {
            const pages = await contextCache(this.server.app.cache, id(), 'page').get()

            // This covers off the sceanario where the cache has unexpectedly expired
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

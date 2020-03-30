/**
 * The cache is divided into individually addressable contexts
 */
const contexts = {
  page: { identifier: 'page-context', initializer: { permissions: [] } },
  transaction: { identifier: 'transaction-context', initializer: { payment: {}, permissions: [] } },
  status: { identifier: 'status-context', initializer: { permissions: [], currentPermissionIdx: 0 } }
}

/**
 * These functions are the pure getters and setters on the cache and are not exposed on the
 * request object
 * @param appCache
 * @param id
 * @returns {init: (function(*=): *), set: (function(*=): *), get: (function(): *)} functions
 */
const base = (appCache, id) => ({
  init: async obj => appCache.set(id, obj),
  get: async () => appCache.get(id),
  set: async obj => appCache.set(id, obj)
})

/**
 * These functions wrap the pure getters and setters with the cache context
 * @param appCache
 * @param id
 * @returns base functions
 */
const contextCache = (appCache, id, context) => ({
  get: async () => {
    const cache = await base(appCache, id).get()
    return cache ? cache[contexts[context].identifier] : null
  },
  set: async obj => {
    if (!obj || typeof obj !== 'object') {
      throw new Error('Expect object')
    }
    const cache = await base(appCache, id).get()
    const local = cache[contexts[context].identifier]
    Object.assign(local, obj)
    Object.assign(cache, { [contexts[context].identifier]: local })
    await base(appCache, id).set(cache)
  }
})

export { contexts, base, contextCache }

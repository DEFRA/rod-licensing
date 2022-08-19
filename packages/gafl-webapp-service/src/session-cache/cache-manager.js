/**
 * The cache is divided into individually addressable contexts;
 * (1) Page - the payload and error data for each individual page
 * (2) Status - pages completed, flags
 * (3) Transaction - the validated set of data making up the licence purchase
 * (4) Address lookup - stores the result of the OS spaces lookup
 * (5) Analytics - stores whether selected an option for accepting/rejecting analytics
 */
const contexts = {
  page: { identifier: 'page-context', initializer: { permissions: [] } },
  transaction: { identifier: 'transaction-context', initializer: { payment: {}, permissions: [] } },
  status: { identifier: 'status-context', initializer: { permissions: [], currentPermissionIdx: -1 } },
  addressLookup: { identifier: 'address-lookup-context', initializer: { permissions: [] } },
  analytics: { identifier: 'analytics-context', initializer: { permissions: [] } }
}

class CacheError extends Error {}

/**
 * These functions are the pure getters and setters against the overall cache and are not exposed on the
 * request object.
 * @param appCache
 * @param id
 * @returns {init: (function(*=): *), set: (function(*=): *), get: (function(): *)} functions
 */
const base = (appCache, id) => ({
  init: async obj => appCache.set(id, obj),
  get: async () => appCache.get(id),
  set: async obj => appCache.set(id, obj),
  clear: async () => appCache.drop(id)
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
    console.log('obj', obj)
    const cache = await base(appCache, id).get()
    const local = cache[contexts[context].identifier]
    Object.assign(local, obj)
    Object.assign(cache, { [contexts[context].identifier]: local })
    console.log('cache', cache)
    console.log('appCache: ', appCache)
    console.log('id: ', id)
    await base(appCache, id).set(cache)
    const test = await base(appCache, id).set(cache)
    console.log('base', test)
  }
})

export { contexts, base, contextCache, CacheError }

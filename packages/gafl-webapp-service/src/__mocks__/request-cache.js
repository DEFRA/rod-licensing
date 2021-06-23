const createCache = (cache = {}) => ({
  helpers: {
    status: {
      getCurrentPermission: () => cache.status || {}
    },
    transaction: {
      get: () => cache.transaction || { permissions: [] }
    }
  }
})

export const createMockRequest = (opts = {}) => ({
  cache: () => createCache(opts.cache)
})
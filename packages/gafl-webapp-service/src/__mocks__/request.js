const createCache = (cache = {}) => ({
  helpers: {
    status: {
      getCurrentPermission: () => cache.status || {},
      set: cache.status?.set || (() => {})
    },
    transaction: {
      get: () => cache.transaction || { permissions: [] }
    }
  }
})

export const createMockRequest = (opts = {}) => ({
  cache: () => createCache(opts.cache),
  payload: opts.payload || {},
  query: opts.query || {}
})

export const createMockRequestToolkit = () => ({
  redirect: jest.fn()
})

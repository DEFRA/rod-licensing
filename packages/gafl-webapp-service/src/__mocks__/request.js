const createCache = (cache = {}) => ({
  helpers: {
    status: {
      getCurrentPermission: () => cache.status?.permissions[0] || {},
      set: () => cache.status || (() => {})
    },
    transaction: {
      getCurrentPermission: () => cache.transaction?.permissions[0] || {},
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

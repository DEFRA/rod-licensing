const createCache = (cache = {}) => ({
  helpers: {
    status: {
      setCurrentPermission: () => cache.status.permissions[0] || {},
      getCurrentPermission: () => cache.status?.permissions[0] || {},
      get: () => cache.status || { permissions: [] },
      set: () => cache.status || (() => {})
    },
    transaction: {
      setCurrentPermission: () => cache.transaction.permissions[0] || {},
      getCurrentPermission: () => cache.transaction?.permissions[0] || {},
      get: () => cache.transaction || { permissions: [] },
      set: () => cache.transaction || (() => {})
    },
    page: {
      setCurrentPermission: () => cache.page.permissions[0] || {},
      getCurrentPermission: () => cache.page?.permissions[0] || {},
      get: () => cache.page || { permissions: [] },
      set: () => cache.page || (() => {})
    },
    addressLookup: {
      setCurrentPermission: () => cache.addressLookup.permissions[0] || {},
      getCurrentPermission: () => cache.addressLookup?.permissions[0] || {},
      get: () => cache.addressLookup || { permissions: [] },
      set: () => cache.addressLookup || (() => {})
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

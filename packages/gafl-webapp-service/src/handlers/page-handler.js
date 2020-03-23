'use strict'

// flatten the errors to a usable form on the template. Expect to be refined
const errorShimm = e => e.details.reduce((a, c) => ({ ...a, [c.path[0]]: c.type }), {})

const pageCtx = 'page'
const statusCtx = 'status'

export default (path, view, completion) => ({
  /**
   * Generic get handler for pages
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  get: async (request, h) => {
    const cache = await request.cache().get(pageCtx)
    return h.view(view, cache[view])
  },
  /**
   * Generic post handler for pages
   * @param request
   * @param h
   * @returns {Promise<*|Response>}
   */
  post: async (request, h) => {
    await request.cache().set(pageCtx, { [view]: { payload: request.payload } })
    await request.cache().set(statusCtx, { [view]: 'completed' })
    await request.cache().set(statusCtx, { currentPage: view })

    return h.redirect(completion)
  },
  /**
   * Generic error handler for pages
   * @param request
   * @param h
   * @param err
   * @returns {Promise}
   */
  error: async (request, h, err) => {
    await request.cache().set(pageCtx, { [view]: { payload: request.payload, error: errorShimm(err) } })
    await request.cache().set(statusCtx, { [view]: 'error' })
    await request.cache().set(statusCtx, { currentPage: view })
    return h.redirect(path).takeover()
  }
})

// flatten the errors to a usable form on the template. Expect to be refined
const errorShimm = e => e.details.reduce((a, c) => ({ ...a, [c.path[0]]: c.type }), {})

const pageCtx = 'page'
const statusCtx = 'status'

/**
 * @param path - the path attached to the handler
 * @param view - the name of the view template
 * @param completion - redirect to on successful completion
 * @param getData - This function is used to preload the page with any data required to populate
 * @returns {{post: (function(*, *): ResponseObject | * | Response), get: (function(*, *): *), error: (function(*, *, *=): ResponseObject)}}
 */
export default (path, view, completion, getData) => ({
  /**
   * Generic get handler for pages
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  get: async (request, h) => {
    const cache = await request.cache().get(pageCtx)
    const pageData = cache[view] || {}
    if (getData && typeof getData === 'function') {
      const data = await getData(request)
      Object.assign(pageData, { data })
    }
    return h.view(view, pageData)
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

'use strict'

export default (path, view, completion) => ({
  /**
   * Generic get handler for pages
   * @param request
   * @param h
   * @returns {Promise<*>}
   */
  get: async (request, h) => {
    const cache = await request.cache().get()
    return h.view(view, cache[view])
  },
  /**
   * Generic post handler for pages
   * @param request
   * @param h
   * @returns {Promise<*|Response>}
   */
  post: async (request, h) => {
    await request.cache().set({ [view]: { payload: request.payload } })
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
    await request.cache().set({ [view]: { payload: request.payload, error: err.details } })
    return h.redirect(view).takeover()
  }
})

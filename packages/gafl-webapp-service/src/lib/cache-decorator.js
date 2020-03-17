'use strict'
/*
 * Decorators to make access to the session cache available as
 * simple setters and getters hiding the session key.
 */
const cacheDecorator = sessionCookieName =>
  function () {
    const id = () => this.state[sessionCookieName].id

    return {
      set: async obj => {
        if (!obj || typeof obj !== 'object') {
          throw new Error('Expect object')
        }
        const cache = await this.server.app.cache.get(id())
        await this.server.app.cache.set(id(), Object.assign(cache || {}, obj))
      },
      get: async () => this.server.app.cache.get(id())
      // drop: async () => this.server.cache.drop(id())
    }
  }

export default cacheDecorator

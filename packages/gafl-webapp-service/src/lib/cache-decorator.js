'use strict'
/*
 * Decorators to make access to the session cache available as
 * simple setters and getters hiding the session key.
 */
<<<<<<< HEAD
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
=======
import db from 'debug'

const debug = db('cache-decorator')

const cacheDecorator = (sessionCookieName) => function () {
  const id = () => this.state[sessionCookieName].id

  return {
    get: async () => this.server.app.cache.get(id()),
    set: async (obj) => {
      console.debug(`Saving ${JSON.stringify(obj)} to ${id()}`)
      const existing = await this.server.app.cache.get(id())
      await this.server.app.cache.set(id(), Object.assign(existing || {}, obj))
    },
    drop: async () => {
      await this.server.cache.drop(id())
    }
  }
}
>>>>>>> Added session and cache mechanism

export default cacheDecorator

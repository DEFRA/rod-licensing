'use strict'
/*
 * Decorators to make access to the session cache available as
 * simple setters and getters hiding the session key.
 */
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

export default cacheDecorator

import { createCache } from 'cache-manager'
import Keyv from 'keyv'
import KeyvRedis from '@keyv/redis'
// import { REDIS_PORT_DEFAULT } from './constants.js'

export class StormPadlockCache {
  constructor () {
    // TODO: Have local memory fallback for testing, like other cache
    this._cache = createCache({
      stores: [
        new Keyv({
          store: new KeyvRedis(process.env.TODO_SORT_OUT_REDIS_URI)
        })
      ]
    })
  }

  async getCachedToken () {
    await this._cache.get('storm_token')
  }

  async setCachedToken (value, timeout) {
    await this._cache.set('storm_token', value, timeout)
  }

  async disconnect () {
    await this._cache.disconnect()
  }
}

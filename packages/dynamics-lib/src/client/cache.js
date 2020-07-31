import Project from '../project.cjs'
import cacheManager from 'cache-manager'
import redisStore from 'cache-manager-ioredis'

export function config () {
  return {
    store: 'memory',
    ttl: process.env.DYNAMICS_CACHE_TTL || 60 * 60 * 12,
    ...(process.env.REDIS_HOST && {
      store: redisStore,
      keyPrefix: `${Project.packageJson.version}/`,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT || 6379,
      ...(process.env.REDIS_PASSWORD && {
        password: process.env.REDIS_PASSWORD,
        tls: {}
      })
    })
  }
}

const cache = cacheManager.caching(config())

process.env.REDIS_HOST && cache.store.getClient().on('error', console.error)

export class CacheableOperation {
  constructor (cacheKey, fetchOp, resultProcessor) {
    this._cacheKey = cacheKey
    this._fetchOp = fetchOp
    this._resultProcessor = resultProcessor
  }

  async execute () {
    return this._resultProcessor(await this._fetchOp())
  }

  async cached () {
    const data = await cache.wrap(this._cacheKey, this._fetchOp)
    return this._resultProcessor(data)
  }
}

export default cache

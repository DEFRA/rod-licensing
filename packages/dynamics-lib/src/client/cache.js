import cacheManager from 'cache-manager'
import redisStore from 'cache-manager-ioredis'
const redisCache = cacheManager.caching({
  store: 'memory',
  ttl: 60 * 60 * 12,
  ...(process.env.REDIS_HOST && process.env.REDIS_PORT && { store: redisStore, host: process.env.REDIS_HOST, port: process.env.REDIS_PORT })
})

process.env.REDIS_HOST && process.env.REDIS_PORT && redisCache.store.getClient().on('error', console.error)

export default redisCache

import cacheManager from 'cache-manager'
import redisStore from 'cache-manager-ioredis'
const cache = cacheManager.caching({
  store: 'memory',
  ttl: process.env.DYNAMICS_CACHE_TTL || 60 * 60 * 12,
  ...(process.env.REDIS_HOST && { store: redisStore, host: process.env.REDIS_HOST, port: process.env.REDIS_PORT || 6379 })
})

process.env.REDIS_HOST && cache.store.getClient().on('error', console.error)

export default cache

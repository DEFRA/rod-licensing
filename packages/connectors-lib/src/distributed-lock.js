import Redlock from 'redlock'
import Redis from 'ioredis'
import db from 'debug'
const debug = db('connectors:distributed-lock')

/**
 * Allows for the creation of a distributed lock using redis/redlock
 */
export class DistributedLock {
  constructor (lockName, ttlMs) {
    this._lockName = lockName
    this._ttl = ttlMs
    this._lock = null
    this._extendTimer = null
    this._redlock = null
  }

  /**
   * Initialise redlock/redis
   *
   * @returns {Promise<void>}
   * @private
   */
  async _initialiseRedlock () {
    this._redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ...(process.env.REDIS_PASSWORD && {
        password: process.env.REDIS_PASSWORD,
        tls: {}
      })
    })
    this._redlock = new Redlock([this._redis])
    this._redlock.on('clientError', console.error)
  }

  /**
   * Attempt to obtain a lock.  This method will wait up until maxWaitSeconds to obtain a lock.  If a lock cannot be obtained within this time
   * then an exception will be thrown.  Set maxWaitSeconds to -1 to wait forever, set maxWaitSeconds to 0 to throw immediately.  A positive value
   * defines the number of seconds to wait before throwing
   *
   * @param {number} maxWaitSeconds the time to wait to obtain a lock
   * @returns {Promise<void>}
   */
  async obtain ({ maxWaitSeconds = -1 } = {}) {
    await this._initialiseRedlock()
    const invocationTime = new Date()
    let elapsed = 0
    do {
      debug('Attempting to obtain lock for %s', this._lockName)
      try {
        this._lock = await this._redlock.lock(this._lockName, this._ttl)
        elapsed = (new Date() - invocationTime) / 1000
      } catch (e) {
        // Ignored
      }
      // eslint-disable-next-line no-unmodified-loop-condition
    } while (!this._lock && (maxWaitSeconds < 0 || elapsed < maxWaitSeconds))

    if (!this._lock) {
      throw new Error(`Unable to obtain the lock '${this._lockName}' within the required time.`)
    }

    this._extendTimer = setInterval(async () => {
      debug('Extending lock for %s', this._lockName)
      await this._lock.extend(this._ttl)
    }, Math.ceil(this._ttl / 2))
  }

  /**
   * Obtain a lock and execute the asynchronous method specific in the onLockObtained parameter.  After the method has been executed the lock will
   * automatically be released
   *
   * @param {function: Promise} onLockObtained the method to execute after obtaining a lock
   * @param {function(Error): Promise} [onLockError] optionally, a method to execute if an error occurred attempting to obtain the lock
   * @param {number} maxWaitSeconds the time to wait when attempting to obtain the lock
   * @returns {Promise<void>}
   */
  async obtainAndExecute ({
    onLockObtained,
    onLockError = async e => {
      throw e
    },
    maxWaitSeconds
  }) {
    try {
      await this.obtain({ maxWaitSeconds })
    } catch (e) {
      await onLockError(e)
    }
    if (this._lock) {
      try {
        await onLockObtained()
      } finally {
        await this.release()
      }
    }
  }

  /**
   * Releases the lock.  If the lock has already been released then this is a no-op
   *
   * @returns {Promise<void>}
   */
  async release () {
    debug('Releasing lock for %s', this._lockName)
    clearInterval(this._extendTimer)
    if (this._lock) {
      await this._lock.unlock()
      await this._redlock.quit()
      this._redis.disconnect()
      this._lock = null
      this._redlock = null
      this._redis = null
    }
  }
}

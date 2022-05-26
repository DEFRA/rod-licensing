import { DistributedLock } from '../distributed-lock.js'
import ioredis from 'ioredis'

jest.mock('ioredis')

const locks = {}
class MockLock {
  constructor (lockName) {
    this._lockName = lockName
    this.extend = jest.fn(async () => {
      // not required
    })
    this.unlock = jest.fn(async () => {
      delete locks[this._lockName]
    })
  }
}
const mockLockFn = jest.fn(async lockName => {
  while (locks[lockName]) {
    await new Promise(resolve => setTimeout(resolve, 10))
  }
  locks[lockName] = new MockLock(lockName)
  return locks[lockName]
})

jest.mock('redlock', () => {
  return jest.fn(() => {
    return {
      lock: mockLockFn,
      on: jest.fn(),
      quit: jest.fn(async () => {
        // not required
      })
    }
  })
})

describe('DistributedLock', () => {
  beforeEach(jest.clearAllMocks)

  it('only allows a single process to obtain a lock', async () => {
    let lock1ReleaseTime
    let lock2ObtainTime
    process.nextTick(async () => {
      const lock = new DistributedLock('test-process', 50)
      await expect(
        lock.obtainAndExecute({
          onLockObtained: async () => {
            await new Promise(resolve => setTimeout(resolve, 100))
            lock1ReleaseTime = Date.now()
          },
          maxWaitSeconds: -1
        })
      ).resolves.toBeUndefined()
    })
    process.nextTick(async () => {
      const lock = new DistributedLock('test-process', 50)
      await expect(
        lock.obtainAndExecute({
          onLockObtained: async () => {
            lock2ObtainTime = Date.now()
          },
          maxWaitSeconds: -1
        })
      ).resolves.toBeUndefined()
      expect(lock2ObtainTime).toBeGreaterThanOrEqual(lock1ReleaseTime)
    })
  })

  it('allows two concurrent locks with different names', async () => {
    let lock1ReleaseTime
    let lock2ObtainTime
    const lock1Promise = new Promise((resolve, reject) => {
      process.nextTick(async () => {
        const lock = new DistributedLock('test-process1', 50)
        await expect(
          lock.obtainAndExecute({
            onLockObtained: async () => {
              await new Promise(resolve => setTimeout(resolve, 100))
              lock1ReleaseTime = Date.now()
            },
            maxWaitSeconds: -1
          })
        ).resolves.toBeUndefined()
        resolve()
      })
    })
    const lock2Promise = new Promise((resolve, reject) => {
      process.nextTick(async () => {
        const lock = new DistributedLock('test-process2', 50)
        await expect(
          lock.obtainAndExecute({
            onLockObtained: async () => {
              lock2ObtainTime = Date.now()
              await new Promise(resolve => setTimeout(resolve, 200))
            },
            maxWaitSeconds: -1
          })
        ).resolves.toBeUndefined()
        resolve()
      })
    })
    await Promise.all([lock1Promise, lock2Promise])
    expect(lock2ObtainTime).toBeLessThan(lock1ReleaseTime)
  })

  it('calling release multiple times has no adverse effects', async () => {
    const lock = new DistributedLock('test-process1', 50)
    await expect(
      lock.obtainAndExecute({
        onLockObtained: async () => {
          await new Promise(resolve => setTimeout(resolve, 1))
        },
        maxWaitSeconds: 0
      })
    ).resolves.toBeUndefined()
    await expect(lock.release()).resolves.toBeUndefined()
    await expect(lock.release()).resolves.toBeUndefined()
    await expect(lock.release()).resolves.toBeUndefined()
  })

  it('configures the connection to redis based on environment variables', async () => {
    process.env.REDIS_HOST = 'test-instance'
    process.env.REDIS_PORT = 1234
    process.env.REDIS_PASSWORD = 'open-sesame'
    const lock = new DistributedLock('test-process1', 50)
    await expect(lock.obtain()).resolves.toBeUndefined()

    expect(ioredis).toHaveBeenCalledWith({
      host: 'test-instance',
      port: '1234',
      password: 'open-sesame',
      tls: {}
    })
    await lock.release()
  })

  it('throws if onLockError not set and the lock cannot be obtained within the allowed time', async () => {
    const lock = new DistributedLock('test-process1', 50)

    mockLockFn.mockRejectedValue(new Error('Lock not obtainable'))
    await expect(
      lock.obtainAndExecute({
        onLockObtained: async () => {
          await new Promise(resolve => setTimeout(resolve, 100))
        },
        maxWaitSeconds: 0
      })
    ).rejects.toThrow("Unable to obtain the lock 'test-process1' within the required time.")
  })

  it('invokes onLockError if it is set and the lock cannot be obtained within the allowed time', async () => {
    const lock = new DistributedLock('test-process1', 50)
    mockLockFn.mockRejectedValue(new Error('Lock not obtainable'))

    const mockOnLockObtained = jest.fn()
    const mockOnLockError = jest.fn()
    await expect(
      lock.obtainAndExecute({
        onLockObtained: mockOnLockObtained,
        onLockError: mockOnLockError,
        maxWaitSeconds: 0
      })
    ).resolves.toBeUndefined()
    expect(mockOnLockObtained).not.toHaveBeenCalled()
    expect(mockOnLockError).toHaveBeenCalledWith(expect.any(Error))
  })
})

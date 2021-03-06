'use strict'

import environment from '../environment.js'

test('Good Environment', () => {
  const { env } = environment(
    {
      FIRST_URL: 'http://0.0.0.0:1000/queue',
      FIRST_SUBSCRIBER: 'http://localhost:1000/service',
      FIRST_MAX_POLLING_INTERVAL_MS: 10000,
      FIRST_ATTEMPTS_WITH_NO_DELAY: 15,
      FIRST_VISIBILITY_TIMEOUT_MS: 100,
      FIRST_WAIT_TIME_MS: 1000,
      FIRST_SUBSCRIBER_TIMEOUT_MS: 10
    },
    'FIRST'
  )

  expect(env).toEqual({
    URL: 'http://0.0.0.0:1000/queue',
    SUBSCRIBER: 'http://localhost:1000/service',
    MAX_POLLING_INTERVAL_MS: 10000,
    ATTEMPTS_WITH_NO_DELAY: 15,
    VISIBILITY_TIMEOUT_MS: 100,
    WAIT_TIME_MS: 1000,
    SUBSCRIBER_TIMEOUT_MS: 10
  })
})

test('defaults used when option environment variables omitted', () => {
  const { env } = environment(
    {
      FIRST_URL: 'http://0.0.0.0:1000/queue',
      FIRST_SUBSCRIBER: 'http://localhost:1000/service',
      FIRST_VISIBILITY_TIMEOUT_MS: 210000
    },
    'FIRST'
  )

  expect(env).toEqual({
    URL: 'http://0.0.0.0:1000/queue',
    SUBSCRIBER: 'http://localhost:1000/service',
    MAX_POLLING_INTERVAL_MS: 300000,
    ATTEMPTS_WITH_NO_DELAY: 10,
    VISIBILITY_TIMEOUT_MS: 210000,
    WAIT_TIME_MS: 20000,
    SUBSCRIBER_TIMEOUT_MS: 180000
  })
})

test('Bad Environment 1', () => {
  expect(() =>
    environment(
      {
        FIST_URL: 'http://0.0.0.0:1000/queue',
        FIRST_SUBSCRIBER: 'http://localhost:1000/service',
        FIRST_MAX_POLLING_INTERVAL_MS: 10000,
        FIRST_VISIBILITY_TIMEOUT_MS: 100,
        FIRST_WAIT_TIME_MS: 1000,
        FIRST_SUBSCRIBER_TIMEOUT_MS: 12000
      },
      'FIRST'
    )
  ).toThrow(Error)
})

test('Visibility timeout too long', () => {
  expect(() =>
    environment(
      {
        FIRST_URL: 'http://0.0.0.0:1000/queue',
        FIRST_SUBSCRIBER: 'http://localhost:1000/service',
        FIRST_VISIBILITY_TIMEOUT_MS: 12 * 60 * 60 * 1000 + 1
      },
      'FIRST'
    )
  ).toThrow(Error)
})

test('No environment', () => {
  expect(() => environment({})).toThrow(Error)
})

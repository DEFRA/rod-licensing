'use strict'

import environment from '../environment.js'

test('Good Environment', () => {
  const { env } = environment(
    {
      FIRST_URL: 'http://0.0.0.0:1000/queue',
      FIRST_SUBSCRIBER: 'http://localhost:1000/service',
      FIRST_POLLING_RATE_MS: 10000,
      FIRST_VISIBILITY_TIMEOUT_MS: 100,
      FIRST_WAIT_TIME_MS: 1000,
      FIRST_NO_DELAY_THRESHOLD: 4,
      FIRST_SUBSCRIBER_TIMEOUT_MS: 12000
    },
    'FIRST'
  )

  expect(env).toEqual({
    URL: 'http://0.0.0.0:1000/queue',
    SUBSCRIBER: 'http://localhost:1000/service',
    POLLING_RATE_MS: 10000,
    VISIBILITY_TIMEOUT_MS: 100,
    WAIT_TIME_MS: 1000,
    NO_DELAY_THRESHOLD: 4,
    SUBSCRIBER_TIMEOUT_MS: 12000
  })
})

test('Bad Environment 1', () => {
  expect(() =>
    environment(
      {
        FIST_URL: 'http://0.0.0.0:1000/queue',
        FIRST_SUBSCRIBER: 'http://localhost:1000/service',
        FIRST_POLLING_RATE_MS: 10000,
        FIRST_VISIBILITY_TIMEOUT_MS: 100,
        FIRST_WAIT_TIME_MS: 1000,
        FIRST_NO_DELAY_THRESHOLD: 4,
        FIRST_SUBSCRIBER_TIMEOUT_MS: 12000
      },
      'FIRST'
    )
  ).toThrow(Error)
})

test('Bad Environment 3', () => {
  expect(() =>
    environment(
      {
        FIRST_URL: 'http://0.0.0.0:1000/queue',
        FIRST_SUBSCRIBER: 'http://localhost:1000/service',
        FIRST_POLLING_RATE_MS: 100,
        FIRST_VISIBILITY_TIMEOUT_MS: 100,
        FIRST_WAIT_TIME_MS: 1000,
        FIRST_NO_DELAY_THRESHOLD: null,
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
        FIRST_POLLING_RATE_MS: '10a0',
        FIRST_VISIBILITY_TIMEOUT_MS: 12 * 60 * 60 + 1,
        FIRST_WAIT_TIME_MS: 1000,
        FIRST_NO_DELAY_THRESHOLD: 4,
        FIRST_SUBSCRIBER_TIMEOUT_MS: 12000
      },
      'FIRST'
    )
  ).toThrow(Error)
})

test('No environment', () => {
  expect(() => environment({})).toThrow(Error)
})

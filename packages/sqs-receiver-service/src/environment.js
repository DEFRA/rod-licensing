'use strict'

import Joi from 'joi'

/**
 * Read the environment, validate and return either a representational object or an error for a given
 * receiver name
 * @param e - The environment given by process.env
 * @param receiverName - The name given in the environment variable RECEIVER_PREFIX (See ecosystem.config.yml)
 * @returns {{error: string}|*}
 */
const environment = (e, receiverName) => {
  if (!receiverName) {
    throw new Error('RECEIVER_PREFIX not set')
  }

  const env = {
    URL: e[`${receiverName}_URL`],
    SUBSCRIBER: e[`${receiverName}_SUBSCRIBER`],
    VISIBILITY_TIMEOUT_MS: e[`${receiverName}_VISIBILITY_TIMEOUT_MS`],
    WAIT_TIME_MS: e[`${receiverName}_WAIT_TIME_MS`] || 20000,
    MAX_POLLING_INTERVAL_MS: e[`${receiverName}_MAX_POLLING_INTERVAL_MS`] || 300000,
    SUBSCRIBER_TIMEOUT_MS: e[`${receiverName}_SUBSCRIBER_TIMEOUT_MS`] || 180000,
    ATTEMPTS_WITH_NO_DELAY: e[`${receiverName}_ATTEMPTS_WITH_NO_DELAY`] || 10
  }

  // Create the joi validation schemas
  const schema = Joi.object({
    URL: Joi.string()
      .uri()
      .required(),
    SUBSCRIBER: Joi.string()
      .uri()
      .required(),
    MAX_POLLING_INTERVAL_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(60 * 60 * 1000),
    ATTEMPTS_WITH_NO_DELAY: Joi.number()
      .integer()
      .required()
      .min(1),
    VISIBILITY_TIMEOUT_MS: Joi.number()
      .integer()
      .required()
      .greater(Joi.ref('SUBSCRIBER_TIMEOUT_MS'))
      .min(1)
      .max(12 * 60 * 60 * 1000),
    WAIT_TIME_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(20000),
    SUBSCRIBER_TIMEOUT_MS: Joi.number()
      .integer()
      .required()
      .min(0)
      .max(300000)
  })

  // Validate
  const validationResults = schema.validate(env)

  if (validationResults.error) {
    throw validationResults.error
  }

  // Return the error or the validated environment object
  return { env: validationResults.value }
}

export default environment

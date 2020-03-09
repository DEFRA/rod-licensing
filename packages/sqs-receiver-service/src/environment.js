'use strict'

import Joi from '@hapi/joi'

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
    POLLING_RATE_MS: e[`${receiverName}_POLLING_RATE_MS`],
    VISIBILITY_TIMEOUT_MS: e[`${receiverName}_VISIBILITY_TIMEOUT_MS`],
    SUBSCRIBER_RATE_LIMIT_MS: e[`${receiverName}_SUBSCRIBER_RATE_LIMIT_MS`],
    SUBSCRIBER_PARALLEL_LIMIT: e[`${receiverName}_SUBSCRIBER_PARALLEL_LIMIT`],
    WAIT_TIME_MS: e[`${receiverName}_WAIT_TIME_MS`],
    NO_DELAY_THRESHOLD: e[`${receiverName}_NO_DELAY_THRESHOLD`],
    SUBSCRIBER_TIMEOUT_MS: e[`${receiverName}_SUBSCRIBER_TIMEOUT_MS`]
  }

  // Create the joi validation schemas
  const schema = Joi.object({
    URL: Joi.string()
      .uri()
      .required(),
    SUBSCRIBER: Joi.string()
      .uri()
      .required(),
    POLLING_RATE_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(1 * 60 * 60 * 1000),
    VISIBILITY_TIMEOUT_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(12 * 60 * 60 * 1000),
    SUBSCRIBER_RATE_LIMIT_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(60 * 1000),
    SUBSCRIBER_PARALLEL_LIMIT: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(24),
    WAIT_TIME_MS: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(20000),
    NO_DELAY_THRESHOLD: Joi.number()
      .integer()
      .required()
      .min(1)
      .max(9),
    SUBSCRIBER_TIMEOUT_MS: Joi.number()
      .integer()
      .required()
      .min(0)
      .max(120000)
  })

  // Validate
  const validationResults = schema.validate(env)

  if (validationResults.error) {
    throw new Error(validationResults.error)
  }

  // Return the error or the validated environment object
  return { env: validationResults.value }
}

export default environment

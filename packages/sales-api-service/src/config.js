import Joi from 'joi'
const defaultStagingTtl = 60 * 60 * 168

const validateAndConvert = (config, schema) => {
  const result = schema.validate(config, { convert: true })
  if (result.error) {
    throw result.error
  }
  return result.value
}

export const SERVER = validateAndConvert(
  {
    Port: process.env.PORT || 4000,
    KeepAliveTimeout: process.env.HAPI_KEEP_ALIVE_TIMEOUT_MS || 60000
  },
  Joi.object({
    Port: Joi.number()
      .min(1)
      .max(65535)
      .required(),
    KeepAliveTimeout: Joi.number()
      .min(0)
      .required()
  }).required()
)

export const PAYMENTS_TABLE = validateAndConvert(
  {
    TableName: process.env.PAYMENT_JOURNALS_TABLE || 'PaymentJournals',
    Ttl: process.env.PAYMENT_JOURNALS_TABLE_TTL || defaultStagingTtl
  },
  Joi.object({
    TableName: Joi.string()
      .trim()
      .min(1)
      .required(),
    Ttl: Joi.number()
      .min(1)
      .required()
  }).required()
)

export const TRANSACTION_STAGING_TABLE = validateAndConvert(
  {
    TableName: process.env.TRANSACTION_STAGING_TABLE || 'TransactionStaging',
    Ttl: process.env.TRANSACTION_STAGING_TABLE_TTL || defaultStagingTtl,
    StagingErrorsTtl: 60 * 60 * 24 * 365
  },
  Joi.object({
    TableName: Joi.string()
      .trim()
      .min(1)
      .required(),
    Ttl: Joi.number()
      .min(1)
      .required(),
    StagingErrorsTtl: Joi.number()
      .min(1)
      .required()
  }).required()
)

export const TRANSACTION_STAGING_HISTORY_TABLE = validateAndConvert(
  {
    TableName: process.env.TRANSACTION_STAGING_HISTORY_TABLE || 'TransactionStagingHistory',
    Ttl: process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL || 60 * 60 * 24 * 90
  },
  Joi.object({
    TableName: Joi.string()
      .trim()
      .min(1)
      .required(),
    Ttl: Joi.number()
      .min(1)
      .required()
  }).required()
)

export const TRANSACTION_QUEUE = validateAndConvert(
  {
    Url: process.env.TRANSACTION_QUEUE_URL || 'http://0.0.0.0:9324/queue/TransactionsQueue.fifo'
  },
  Joi.object({
    Url: Joi.string()
      .trim()
      .uri({ scheme: ['http', 'https'] })
      .required()
  }).required()
)

const defaultStagingTtl = 60 * 60 * 168

export const SERVER = {
  Port: process.env.PORT || 4000,
  SocketTimeout: process.env.HAPI_SOCKET_TIMEOUT_MS
}

export const PAYMENTS_TABLE = {
  TableName: process.env.PAYMENT_JOURNALS_TABLE,
  Ttl: process.env.PAYMENT_JOURNALS_TABLE_TTL || defaultStagingTtl
}

export const TRANSACTION_STAGING_TABLE = {
  TableName: process.env.TRANSACTION_STAGING_TABLE,
  Ttl: process.env.TRANSACTION_STAGING_TABLE_TTL || defaultStagingTtl,
  StagingErrorsTtl: 60 * 60 * 24 * 365
}

export const TRANSACTION_STAGING_HISTORY_TABLE = {
  TableName: process.env.TRANSACTION_STAGING_HISTORY_TABLE,
  Ttl: process.env.TRANSACTION_STAGING_HISTORY_TABLE_TTL || 60 * 60 * 24 * 90
}

export const TRANSACTION_QUEUE = {
  Url: process.env.TRANSACTION_QUEUE_URL
}

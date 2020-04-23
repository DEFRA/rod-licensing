import db from 'debug'
const debug = db('sales:transactions')

export async function processDlq ({ id }) {
  debug('Processed message from dlq with payload', id)
  // TODO: Implement
}

import db from 'debug'

const debug = db('webapp:set-agreed')

export default async request => {
  debug('Setting status to agreed')
  await request.cache().helpers.status.set({ agreed: true })
}

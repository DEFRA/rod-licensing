import { TERMS_AND_CONDITIONS } from '../../constants.js'
import db from 'debug'

const debug = db('webapp:set-agreed')

export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(TERMS_AND_CONDITIONS.page)

  if (payload.agree === 'yes') {
    debug('Setting status to agreed')
    await request.cache().helpers.status.set({ agreed: true })
  }
}

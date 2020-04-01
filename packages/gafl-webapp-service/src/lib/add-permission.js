import { MAX_PERMISSIONS } from '../constants.js'
import boom from '@hapi/boom'
import db from 'debug'
const debug = db('add-permission')

export default async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const page = await request.cache().helpers.page.get()
  const status = await request.cache().helpers.status.get('page')
  if (transaction.permissions.length >= MAX_PERMISSIONS) {
    throw boom.badRequest('Too many permissions')
  }
  debug(`Add permission: ${transaction.permissions.length}`)
  transaction.permissions.push({})
  page.permissions.push({})
  status.permissions.push({})
  await request.cache().helpers.transaction.set(transaction)
  await request.cache().helpers.page.set(page)
  await request.cache().helpers.status.set(status)
  await request.cache().helpers.status.set({ currentPermissionIdx: transaction.permissions.length - 1 })
}

import filterPermits from './filter-permits.js'
import crypto from 'crypto'
import db from 'debug'

const debug = db('webapp:find-and-hash-permit')

export const hashPermission = async (permission, request) => {
  const clonedPermission = { ...permission }
  const generatedHash = crypto.createHash('sha256')
  const currentHash = generatedHash.update(JSON.stringify(clonedPermission))
  const newSingleUseHash = generatedHash.digest('hex')

  if (!clonedPermission.hash) {
    clonedPermission.hash = newSingleUseHash
  } else {
    if (currentHash !== newSingleUseHash) {
      clonedPermission.hash = newSingleUseHash
    } else {
      debug("permit data present and doesn't need updating")
    }
  }

  await request.cache().helpers.transaction.setCurrentPermission(clonedPermission)
  return clonedPermission
}

export const assignPermit = async (permission, request) => {
  const hashedPermission = await hashPermission(permission, request)
  const permit = await filterPermits(permission)
  hashedPermission.permit = permit
  if (permit) {
    if (!permit.newCostStartDate || !permit.newCost) {
      debug('permit missing new cost details', permission)
    }
  } else {
    debug("permit wasn't retrieved", permission)
  }

  await request.cache().helpers.transaction.setCurrentPermission(hashedPermission)
  return hashedPermission
}

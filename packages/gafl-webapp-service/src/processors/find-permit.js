import filterPermits from './filter-permits.js'
import crypto from 'crypto'
import db from 'debug'

const debug = db('webapp:find-permit')

export const retrievePermit = async permission => {
  const permit = await filterPermits(permission)
  if (permit) {
    if (!permit.newCostStartDate || !permit.newCost) {
      debug('permit missing new cost details', permission)
    }
  } else {
    debug("permit wasn't retrieved", permission)
  }
  return permit
}

const updateHash = permission => {
  const { hash: _hash, permit: _permit, licensee: _licensee, ...hashOperand } = permission
  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(hashOperand))
  const updatedHash = hash.digest('hex')
  return updatedHash
}

export const findPermit = async permission => {
  const permitPermission = { ...permission }
  if (!permitPermission.hash) {
    permitPermission.permit = await retrievePermit(permitPermission)
    permitPermission.hash = updateHash(permitPermission)
  } else {
    const currentHash = updateHash(permitPermission)
    if (currentHash !== permitPermission.hash) {
      permitPermission.permit = await retrievePermit(permitPermission)
      permitPermission.hash = currentHash
    } else {
      debug("permit data present and doesn't need updating")
    }
  }

  return permitPermission
}

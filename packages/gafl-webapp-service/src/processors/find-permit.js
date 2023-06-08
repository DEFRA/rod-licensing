import filterPermits from './filter-permits.js'
import crypto from 'crypto'
import db from 'debug'

const debug = db('webapp:find-permit')

export const addHashAndPermit = async (permission, request) => {
  // To calculate a permit, hash and save

  const { hash: _hash, permit: _permit, licensee: _licensee, ...hashOperand } = permission
  const permit = await filterPermits(permission)
  const updatedPermission = { ...permission, permit }

  if (permit) {
    if (!permit.newCostStartDate || !permit.newCost) {
      debug('permit missing new cost details', updatedPermission)
    }
  } else {
    debug("permit wasn't retrieved", updatedPermission)
  }

  const hash = crypto.createHash('sha256')
  hash.update(JSON.stringify(hashOperand))
  const updatedHash = hash.digest('hex')
  const updatedRequest = await request.cache().helpers.transaction.setCurrentPermission({
    ...updatedPermission,
    hash: updatedHash
  })
  return updatedRequest
}

export const findPermit = async (permission, request) => {
  /*
   * To stop repeated reads of the API with users repeatably refreshing the page, the transaction cache stores
   * a hash of itself. If the transaction cache has not changed the permit is not recalculated.
   *
   * The section of the transaction cache subject to the hashing algorithm excludes
   * name, address, or anything not effecting permit filter
   */
  const permitPermission = { ...permission }
  if (!permitPermission.hash) {
    await addHashAndPermit(permitPermission, request)
  } else {
    const { hash: _hash, permit: _permit, licensee: _licensee, ...hashOperand } = permitPermission
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(hashOperand))
    const currentHash = hash.digest('hex')
    if (currentHash !== permitPermission.hash) {
      await addHashAndPermit(permitPermission, request)
    } else {
      debug("permit data present and doesn't need updating")
    }
  }

  return permitPermission
}

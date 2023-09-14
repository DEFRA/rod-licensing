import filterPermits from './filter-permits.js'
import crypto from 'crypto'
import db from 'debug'
const debug = db('webapp:find-permit')

export const findPermit = async (permission, request) => {
  /*
   * To stop repeated reads of the API with users repeatably refreshing the page, the transaction cache stores
   * a hash of itself. If the transaction cache has not changed the permit is not recalculated.
   *
   * The section of the transaction cache subject to the hashing algorithm excludes
   * name, address, or anything not effecting permit filter
   */
  const hashOperand = (({ hash: _hash, permit: _permit, licensee: _licensee, ...p }) => p)(permission)

  // To calculate a permit, hash and save
  const addHashAndPermit = async () => {
    const permit = await filterPermits(permission)
    permission.permit = permit
    if (permit) {
      if (!permit.newCostStartDate || !permit.newCost) {
        debug('permit missing new cost details', permission)
      }
    } else {
      debug("permit wasn't retrieved", permission)
    }

    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(hashOperand))
    permission.hash = hash.digest('hex')
    await request.cache().helpers.transaction.setCurrentPermission(permission)
  }

  if (!permission.hash) {
    await addHashAndPermit()
  } else {
    const hash = crypto.createHash('sha256')
    hash.update(JSON.stringify(hashOperand))
    if (hash.digest('hex') !== permission.hash) {
      await addHashAndPermit()
    } else {
      debug("permit data present and doesn't need updating")
    }
  }
}

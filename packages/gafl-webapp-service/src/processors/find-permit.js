import filterPermits from './filter-permits.js'
import crypto from 'crypto'

export const findPermit = async (permission, request) => {
  /*
   * To stop repeated reads of the API with users repeatably refreshing the page, the transaction cache stores
   * a hash of itself. If the transaction cache has not changed the permit is not recalculated.
   *
   * The section of the transaction cache subject to the hashing algorithm excludes
   * name, address, or anything not effecting permit filter
   */
  const hashOperand = (({ _hash, _permit, _licensee, ...p }) => p)(permission)

  // To calculate a permit, hash and save
  const addHashAndPermit = async () => {
    const permit = await filterPermits(permission)
    permission.permit = permit
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
    }
  }
}

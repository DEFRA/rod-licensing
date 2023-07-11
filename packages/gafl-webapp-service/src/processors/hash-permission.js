import crypto from 'crypto'
import db from 'debug'

const debug = db('webapp:hash-permission')

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

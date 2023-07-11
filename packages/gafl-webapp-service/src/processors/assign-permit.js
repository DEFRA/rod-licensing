import filterPermits from './filter-permits.js'
import db from 'debug'

const debug = db('webapp:assign-permit')

export const assignPermit = async (permission, request) => {
  const permit = await filterPermits(permission)
  const permitPermission = { ...permission }
  permitPermission.permit = permit
  if (permit) {
    if (!permit.newCostStartDate || !permit.newCost) {
      debug('permit missing new cost details', permitPermission)
    }
  } else {
    debug("permit wasn't retrieved", permitPermission)
  }

  await request.cache().helpers.transaction.setCurrentPermission(permitPermission)
  return permitPermission
}

import moment from 'moment'
import { DATE_OF_BIRTH } from '../../../uri.js'
import { ageConcessionHelper } from '../../../processors/concession-helper.js'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { onLengthChange } from '../../licence-details/licence-length/update-transaction.js'

const pageCacheMatchesPayload = (pageCache, payload) =>
  JSON.stringify(pageCache[DATE_OF_BIRTH.page].payload) === JSON.stringify(payload)

/**
 * Transfer the validated page object
 * @param request
 * @returns {Promise<void>}
 */
export default async request => {
  const { payload } = await request.cache().helpers.page.getCurrentPermission(DATE_OF_BIRTH.page)

  const dateOfBirth = moment({
    year: payload['date-of-birth-year'],
    month: Number.parseInt(payload['date-of-birth-month']) - 1,
    day: payload['date-of-birth-day']
  }).format(cacheDateFormat)

  const pageCache = await request.cache().helpers.page.get()
  const dobPageCache = pageCache.permissions.find(perm => !!perm[DATE_OF_BIRTH.page])

  if (!pageCacheMatchesPayload(dobPageCache, payload)) {
    console.error('DOB page cache payload does not match current permission payload', { dobPageCache: dobPageCache[DATE_OF_BIRTH.page], payload })
    console.log('page cache', JSON.stringify(await request.cache().helpers.page.get()))
    console.log('transaction cache', JSON.stringify(await request.cache().helpers.transaction.get()))
    console.log('status cache', JSON.stringify(await request.cache().helpers.status.get()))
  }

  // Work out the junior or senior concession at the point at which the licence starts
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // Set the data of birth in the licensee object
  permission.licensee.birthDate = dateOfBirth

  // Set age related concessions
  ageConcessionHelper(permission)
  onLengthChange(permission)

  // Write the permission down
  await request.cache().helpers.transaction.setCurrentPermission(permission)
}

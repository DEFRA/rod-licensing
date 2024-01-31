import moment from 'moment'
import { DATE_OF_BIRTH } from '../../../uri.js'
import { ageConcessionHelper } from '@defra-fish/business-rules-lib'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { onLengthChange } from '../../licence-details/licence-length/update-transaction.js'

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

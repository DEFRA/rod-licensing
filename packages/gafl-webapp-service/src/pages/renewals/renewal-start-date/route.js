import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateFormats } from '../../../constants.js'
import { RENEWAL_START_DATE, RENEWAL_START_VALIDATE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import JoiDate from '@hapi/joi-date'
import moment from 'moment-timezone'
import { displayExpiryDate } from '../../../processors/date-and-time-display.js'
const JoiX = Joi.extend(JoiDate)

const validator = payload => {
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert(
    { 'licence-start-date': licenceStartDate },
    Joi.object({
      'licence-start-date': JoiX.date()
        .format(dateFormats)
        .required()
    })
  )
}

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  const expiryTimeString = displayExpiryDate(permission)
  const endDateMoment = moment.utc(permission.renewedEndDate).tz(SERVICE_LOCAL_TIME)

  return {
    expiryTimeString,
    hasExpired: permission.renewedHasExpired,
    minStartDate: endDateMoment.format('DD MM YYYY'),
    maxStartDate: endDateMoment
      .clone()
      .add(ADVANCED_PURCHASE_MAX_DAYS, 'days')
      .format('DD MM YYYY'),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS
  }
}

export default pageRoute(RENEWAL_START_DATE.page, RENEWAL_START_DATE.uri, validator, RENEWAL_START_VALIDATE.uri, getData)

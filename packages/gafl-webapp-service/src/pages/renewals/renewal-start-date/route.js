import { ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'
import { dateFormats } from '../../../constants.js'
import { RENEWAL_START_DATE, RENEWAL_START_VALIDATE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import JoiDate from '@hapi/joi-date'
import moment from 'moment'
const JoiX = Joi.extend(JoiDate)

const schema = Joi.object({
  'licence-start-date': JoiX.date()
    .format(dateFormats)
    .min(moment().add(-1, 'days'))
    .required()
})

const validator = payload => {
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert({ 'licence-start-date': licenceStartDate }, schema)
}

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  return {
    exampleStartDate: moment()
      .add(1, 'days')
      .format('DD MM YYYY'),
    maxStartDate: moment(permission.renewedEndDate)
      .add(ADVANCED_PURCHASE_MAX_DAYS, 'days')
      .format('DD MM YYYY'),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS
  }
}

export default pageRoute(RENEWAL_START_DATE.page, RENEWAL_START_DATE.uri, validator, RENEWAL_START_VALIDATE.uri, getData)

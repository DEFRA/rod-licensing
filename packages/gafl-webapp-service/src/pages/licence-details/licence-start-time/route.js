import { LICENCE_START_TIME } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import Joi from '@hapi/joi'
import moment from 'moment-timezone'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'

const minHour = permission =>
  moment(permission.licenceStartDate, cacheDateFormat)
    .tz(SERVICE_LOCAL_TIME)
    .isSame(moment(), 'day')
    ? moment()
      .tz(SERVICE_LOCAL_TIME)
      .add(1, 'hour')
      .add(30, 'minute')
      .startOf('hour')
      .hour()
    : 0

const hours = Array(24)
  .fill(0)
  .map((e, idx) => idx.toString())

// Not worth validating dynamically - can only be curl'd to the users disadvantage
const validator = Joi.object({
  'licence-start-time': Joi.string()
    .valid(...hours)
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const startDateStr = moment(permission.licenceStartDate, cacheDateFormat).format('dddd, Do MMMM, YYYY')
  return { startDateStr, minHour: minHour(permission) }
}

export default pageRoute(LICENCE_START_TIME.page, LICENCE_START_TIME.uri, validator, nextPage, getData)

import { LICENCE_START_TIME, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import moment from 'moment'

const minHour = permission =>
  moment(permission.licenceStartDate, 'YYYY-MM-DD').isSame(moment(), 'day')
    ? moment()
        .add(30, 'minute')
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
  const startDateStr = moment(permission.licenceStartDate, 'YYYY-MM-DD').format('dddd, Do MMMM, YYYY')
  return { startDateStr, minHour: minHour(permission) }
}

export default pageRoute(LICENCE_START_TIME.page, LICENCE_START_TIME.uri, validator, CONTROLLER.uri, getData)

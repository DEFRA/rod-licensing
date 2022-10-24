import { LICENCE_START_TIME } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import Joi from 'joi'
import moment from 'moment-timezone'
import { cacheDateFormat } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'

const getMinHour = permission => {
  const now = moment().tz(SERVICE_LOCAL_TIME)
  const permissionStartsToday = moment(permission.licenceStartDate, cacheDateFormat).tz(SERVICE_LOCAL_TIME).isSame(now, 'day')
  if (permissionStartsToday) {
    const cantStartUntilTomorrow = moment(now).add(90, 'minute').isAfter(now, 'day')
    if (cantStartUntilTomorrow) {
      return 24
    }
    return now.add(90, 'minute').startOf('hour').hour()
  }
  return 0
}

const hours = Array(25)
  .fill(0)
  .map((e, idx) => idx.toString())

const validator = (payload, options) => {
  const { permission } = options.context.app.request
  const minHour = getMinHour(permission)

  Joi.assert(
    payload,
    Joi.object({
      'licence-start-time': Joi.string()
        .valid(...hours.filter(h => h >= minHour))
        .required()
    }).options({ abortEarly: false, allowUnknown: true })
  )
}

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const startDateStr = moment(permission.licenceStartDate, cacheDateFormat, request.locale).format('dddd, Do MMMM, YYYY')
  return { startDateStr, minHour: getMinHour(permission) }
}

const route = pageRoute(LICENCE_START_TIME.page, LICENCE_START_TIME.uri, validator, nextPage, getData)
route.find(r => r.method === 'POST').options.ext = {
  onPostAuth: {
    method: async (request, reply) => {
      const permission = await request.cache().helpers.transaction.getCurrentPermission()
      request.app.permission = permission
      return reply.continue
    }
  }
}

export default route

import Joi from 'joi'
import moment from 'moment-timezone'
import { START_AFTER_PAYMENT_MINUTES, ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { nextPage } from '../../../routes/next-page.js'
import { dateSchema, dateSchemaInput } from '../../../schema/date.schema.js'

const LICENCE_TO_START_FIELD = 'licence-to-start'
const AFTER_PAYMENT = 'after-payment'
const ANOTHER_DATE = 'another-date'

export const validator = payload => {
  Joi.assert(
    { 'licence-to-start': payload[LICENCE_TO_START_FIELD] },
    Joi.object({ 'licence-to-start': Joi.string().valid(AFTER_PAYMENT, ANOTHER_DATE).required() })
  )
  if (payload[LICENCE_TO_START_FIELD] === ANOTHER_DATE) {
    const minDate = moment().tz(SERVICE_LOCAL_TIME).startOf('day')
    const maxDate = moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days')

    const day = payload['licence-start-date-day']
    const month = payload['licence-start-date-month']
    const year = payload['licence-start-date-year']

    Joi.assert(dateSchemaInput(day, month, year), dateSchema)
    const startDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`)
    Joi.assert({ startDate }, Joi.object({ startDate: Joi.date().min(minDate.toDate()).max(maxDate.toDate()) }))
  }
}

export const getData = async request => {
  const fmt = 'DD MM YYYY'
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    isLicenceForYou,
    exampleStartDate: moment().tz(SERVICE_LOCAL_TIME).add(1, 'days').format(fmt),
    minStartDate: moment().tz(SERVICE_LOCAL_TIME).format(fmt),
    maxStartDate: moment().tz(SERVICE_LOCAL_TIME).add(ADVANCED_PURCHASE_MAX_DAYS, 'days').format(fmt),
    advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS,
    startAfterPaymentMinutes: START_AFTER_PAYMENT_MINUTES
  }
}

export default pageRoute(LICENCE_TO_START.page, LICENCE_TO_START.uri, validator, nextPage, getData)

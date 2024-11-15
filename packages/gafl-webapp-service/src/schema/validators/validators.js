import Joi from 'joi'
import moment from 'moment'
import { ADVANCED_PURCHASE_MAX_DAYS, SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { dateSchema, dateSchemaInput } from '../date.schema.js'

const MAX_AGE = 120
const LICENCE_TO_START_FIELD = 'licence-to-start'
const AFTER_PAYMENT = 'after-payment'
const ANOTHER_DATE = 'another-date'

export const dateOfBirthValidator = payload => {
  const day = payload['date-of-birth-day']
  const month = payload['date-of-birth-month']
  const year = payload['date-of-birth-year']

  Joi.assert(dateSchemaInput(day, month, year), dateSchema)
  const minDate = moment().tz(SERVICE_LOCAL_TIME).subtract(MAX_AGE, 'years').startOf('day').toDate()
  const maxDate = moment().tz(SERVICE_LOCAL_TIME).subtract(1, 'day').startOf('day').toDate()
  const birthDate = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`)
  Joi.assert({ birthDate }, Joi.object({ birthDate: Joi.date().min(minDate).max(maxDate) }))
}

export const startDateValidator = payload => {
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
    const startDate = moment(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`, 'YYYY-MM-DD')
      .tz(SERVICE_LOCAL_TIME)
      .startOf('day')
      .toDate()
    Joi.assert({ startDate }, Joi.object({ startDate: Joi.date().min(minDate.toDate()).max(maxDate.toDate()) }))
  }
}

import { DATE_OF_BIRTH, CONTROLLER } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import JoiDate from '@hapi/joi-date'

const JoiX = Joi.extend(JoiDate)

const formats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

const schema = Joi.object({
  'date-of-birth': JoiX.date()
    .format(formats)
    .min('01-01-1900')
    .max('now')
    .required()
})

const validator = payload => {
  const dateOfBirth = `${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`
  Joi.assert({ 'date-of-birth': dateOfBirth }, schema)
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, validator, CONTROLLER.uri)

import { DATE_OF_BIRTH, CONTROLLER } from '../../../constants.js'
import Joi from '@hapi/joi'
import pageRoute from '../../../routes/page-route.js'
import { validation } from '@defra-fish/business-rules-lib'

const schema = Joi.object({
  'date-of-birth': validation.contact.birthDateValidator
})

const validator = payload => {
  const dateOfBirth = `${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`
  Joi.assert({ 'date-of-birth': dateOfBirth }, schema)
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, validator, CONTROLLER.uri)

import { DATE_OF_BIRTH } from '../../../uri.js'
import Joi from 'joi'
import pageRoute from '../../../routes/page-route.js'
import { validation } from '@defra-fish/business-rules-lib'
import { nextPage } from '../../../routes/next-page.js'

const schema = Joi.object({
  'date-of-birth': validation.contact.createBirthDateValidator(Joi)
})

const validator = payload => {
  const dateOfBirth = `${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`
  Joi.assert({ 'date-of-birth': dateOfBirth }, schema)
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, validator, nextPage)

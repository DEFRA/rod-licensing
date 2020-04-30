import { DATE_OF_BIRTH, CONTROLLER, LICENCE_TO_START } from '../../../constants.js'
import Joi from '@hapi/joi'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { validation } from '@defra-fish/business-rules-lib'

const schema = Joi.object({
  'date-of-birth': validation.contact.birthDateValidator
})

const validator = payload => {
  const dateOfBirth = `${payload['date-of-birth-year']}-${payload['date-of-birth-month']}-${payload['date-of-birth-day']}`
  Joi.assert({ 'date-of-birth': dateOfBirth }, schema)
}

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  return {}
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, validator, CONTROLLER.uri, getData)

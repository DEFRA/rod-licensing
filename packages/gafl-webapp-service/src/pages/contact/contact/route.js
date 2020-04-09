import { CONTACT, CONTROLLER, CONCESSION, LICENCE_LENGTH, DATE_OF_BIRTH, LICENCE_TO_START } from '../../../constants.js'
import pageRoute from '../../../routes/page-route.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import Joi from '@hapi/joi'

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  // We need to have set the licence length, dob and start date here to determining the contact
  // messaging
  if (!permission.licenceLength) {
    throw new GetDataRedirect(LICENCE_LENGTH.uri)
  }

  if (!permission.licenceStartDate) {
    throw new GetDataRedirect(LICENCE_TO_START.uri)
  }

  if (!permission.licensee.birthDate) {
    throw new GetDataRedirect(DATE_OF_BIRTH.uri)
  }

  return {
    licenceLength: permission.licenceLength,
    junior: permission.licensee.concession && permission.licensee.concession.type === CONCESSION.JUNIOR
  }
}

const validator = Joi.object({
  'how-contacted': Joi.string()
    .valid('email', 'text', 'none')
    .required(),
  email: Joi.alternatives().conditional('how-contacted', {
    is: 'email',
    then: Joi.string()
      .trim()
      .email({ minDomainSegments: 2 })
      .max(50),
    otherwise: Joi.string().empty('')
  }),
  text: Joi.alternatives().conditional('how-contacted', {
    is: 'text',
    then: Joi.string()
      .trim()
      .regex(/^[0-9-+\s()]*$/)
      .max(30),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(CONTACT.page, CONTACT.uri, validator, CONTROLLER.uri, getData)

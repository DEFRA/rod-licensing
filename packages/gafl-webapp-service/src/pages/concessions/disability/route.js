import { DISABILITY_CONCESSION, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'

export const disabilityConcessionTypes = {
  pipDla: 'pip-dla',
  blueBadge: 'blue-badge',
  no: 'no'
}

const validator = Joi.object({
  'disability-concession': Joi.string()
    .valid(...Object.values(disabilityConcessionTypes))
    .required(),
  'ni-number': Joi.alternatives().conditional('disability-concession', {
    is: disabilityConcessionTypes.pipDla,
    then: validation.contact.createNationalInsuranceNumberValidator(Joi).required(),
    otherwise: Joi.string().empty('')
  }),
  'blue-badge-number': Joi.alternatives().conditional('disability-concession', {
    is: disabilityConcessionTypes.blueBadge,
    then: Joi.string().max(40).required(),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

const getData = () => disabilityConcessionTypes

export default pageRoute(DISABILITY_CONCESSION.page, DISABILITY_CONCESSION.uri, validator, CONTROLLER.uri, getData)

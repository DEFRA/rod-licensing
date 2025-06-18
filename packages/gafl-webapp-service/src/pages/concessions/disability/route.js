import { DISABILITY_CONCESSION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { nextPage } from '../../../routes/next-page.js'
import { disabilityConcessionTypes } from './update-transaction.js'

const validator = Joi.object({
  'disability-concession': Joi.string()
    .valid(...Object.values(disabilityConcessionTypes))
    .required(),
  'ni-number': Joi.alternatives().conditional('disability-concession', {
    is: disabilityConcessionTypes.pipDla,
    then: validation.contact.createNationalInsuranceNumberValidator(Joi).required(),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    hasJunior: concessionHelper.hasJunior(permission),
    hasSenior: concessionHelper.hasSenior(permission),
    isLicenceForYou: permission.isLicenceForYou,
    ...disabilityConcessionTypes
  }
}

export default pageRoute(DISABILITY_CONCESSION.page, DISABILITY_CONCESSION.uri, validator, nextPage, getData)

import { ADDRESS_LOOKUP, ADDRESS_ENTRY } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from '@hapi/joi'
import { validation } from '@defra-fish/business-rules-lib'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { isPhysical } from '../../../../processors/licence-type-display.js'
import { nextPage } from '../../../../routes/next-page.js'

const validator = Joi.object({
  premises: validation.contact.createPremisesValidator(Joi),
  postcode: validation.contact.createUKPostcodeValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  return {
    licenceLength: permission.licenceLength,
    junior: concessionHelper.hasJunior(permission),
    entryPage: ADDRESS_ENTRY.uri,
    isPhysical: isPhysical(permission)
  }
}

export default pageRoute(ADDRESS_LOOKUP.page, ADDRESS_LOOKUP.uri, validator, nextPage, getData)

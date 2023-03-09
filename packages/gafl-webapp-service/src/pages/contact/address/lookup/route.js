import { ADDRESS_LOOKUP, ADDRESS_ENTRY, OS_TERMS } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import * as concessionHelper from '../../../../processors/concession-helper.js'
import { isPhysicalOld } from '../../../../processors/licence-type-display.js'
import { nextPage } from '../../../../routes/next-page.js'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'

const validator = Joi.object({
  premises: validation.contact.createPremisesValidator(Joi),
  postcode: validation.contact.createUKPostcodeValidator(Joi)
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()

  return {
    isLicenceForYou: permission.isLicenceForYou,
    licenceLength: permission.licenceLength,
    junior: concessionHelper.hasJunior(permission),
    isPhysical: isPhysicalOld(permission),
    uri: {
      entryPage: addLanguageCodeToUri(request, ADDRESS_ENTRY.uri),
      osTerms: addLanguageCodeToUri(request, OS_TERMS.uri)
    }
  }
}

export default pageRoute(ADDRESS_LOOKUP.page, ADDRESS_LOOKUP.uri, validator, nextPage, getData)

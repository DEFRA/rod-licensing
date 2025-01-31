import { LICENCE_TYPE, FRESHWATER_FISING_RULES, LOCAL_BYELAWS } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { pricingDetail } from '../../../processors/pricing-summary.js'
import Joi from 'joi'
import * as concessionHelper from '../../../processors/concession-helper.js'
import { nextPage } from '../../../routes/next-page.js'

export const licenseTypes = {
  troutAndCoarse2Rod: 'trout-and-coarse-2-rod',
  troutAndCoarse3Rod: 'trout-and-coarse-3-rod',
  salmonAndSeaTrout: 'salmon-and-sea-trout'
}

export const validator = Joi.object({
  'licence-type': Joi.string()
    .valid(...Object.values(licenseTypes))
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const pricing = await pricingDetail(LICENCE_TYPE.page, permission)

  return {
    licenseTypes,
    permission,
    pricing,
    isLicenceForYou: permission.isLicenceForYou,
    hasJunior: concessionHelper.hasJunior(permission),
    uri: {
      freshWaterFishingRules: FRESHWATER_FISING_RULES.uri,
      localByelaws: LOCAL_BYELAWS.uri,
      catchReturn: CATCH_RETURN.uri
    }
  }
}

export default pageRoute(LICENCE_TYPE.page, LICENCE_TYPE.uri, validator, nextPage, getData)

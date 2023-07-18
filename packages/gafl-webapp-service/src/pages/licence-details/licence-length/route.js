import { LICENCE_LENGTH } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { pricingDetail } from '../../../processors/pricing-summary.js'
import { licenceTypeDisplay } from '../../../processors/licence-type-display.js'
import { nextPage } from '../../../routes/next-page.js'

const validator = Joi.object({
  'licence-length': Joi.string().valid('12M', '8D', '1D').required()
}).options({ abortEarly: false, allowUnknown: true })

export const getData = async request => {
  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  const pricing = await pricingDetail(LICENCE_LENGTH.page, permission, request.i18n.getCatalog())

  return {
    pricing,
    isLicenceForYou: permission.isLicenceForYou,
    licenceTypeStr: licenceTypeDisplay(permission, request.i18n.getCatalog())
  }
}

export default pageRoute(LICENCE_LENGTH.page, LICENCE_LENGTH.uri, validator, nextPage, getData)

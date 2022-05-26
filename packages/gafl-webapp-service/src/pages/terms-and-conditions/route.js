import pageRoute from '../../routes/page-route.js'
import * as mappings from '../../processors/mapping-constants.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'

import GetDataRedirect from '../../handlers/get-data-redirect.js'

export const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (!status[LICENCE_SUMMARY.page]) {
    throw new GetDataRedirect(LICENCE_SUMMARY.uri)
  }

  if (!status[CONTACT_SUMMARY.page]) {
    throw new GetDataRedirect(CONTACT_SUMMARY.uri)
  }

  const permission = await request.cache().helpers.transaction.getCurrentPermission()
  return {
    isSalmonAndSeaTrout: permission.licenceType === mappings.LICENCE_TYPE['salmon-and-sea-trout'],
    paymentRequired: !!Number.parseInt(permission.permit.cost)
  }
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)

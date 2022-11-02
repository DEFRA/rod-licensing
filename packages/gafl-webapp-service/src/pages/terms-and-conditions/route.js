import pageRoute from '../../routes/page-route.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'

import GetDataRedirect from '../../handlers/get-data-redirect.js'

export const getData = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (!status[LICENCE_SUMMARY.page]) {
    throw new GetDataRedirect(LICENCE_SUMMARY.uri)
  }

  if (!status[CONTACT_SUMMARY.page]) {
    throw new GetDataRedirect(CONTACT_SUMMARY.uri)
  }
  const licences = transaction.permissions.map(permission => ({
    price: permission.permit.cost
  }))

  return {
    paymentRequired: await priceCalculation(licences)
  }
}

const priceCalculation = async licences => {
  const price = licences.reduce((accumulator, licence) => {
    return accumulator + licence.price
  }, 0)

  if (price > 0) {
    return true
  }

  return false
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)

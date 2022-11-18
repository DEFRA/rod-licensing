import pageRoute from '../../routes/page-route.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import { licenceTypeDisplay } from '../../processors/licence-type-display.js'

import GetDataRedirect from '../../handlers/get-data-redirect.js'

export const getData = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const status = await request.cache().helpers.status.getCurrentPermission()
  const mssgs = request.i18n.getCatalog()

  if (!status[LICENCE_SUMMARY.page]) {
    throw new GetDataRedirect(LICENCE_SUMMARY.uri)
  }

  if (!status[CONTACT_SUMMARY.page]) {
    throw new GetDataRedirect(CONTACT_SUMMARY.uri)
  }

  const licences = transaction.permissions.map(permission => ({
    type: licenceTypeDisplay(permission, mssgs),
    price: permission.permit.cost
  }))

  return {
    paymentRequired: priceCalculation(licences),
    troutAndCoarse2Rods: checkLicenceType(licences, 'Trout and coarse, up to 2 rods'),
    troutAndCoarse3Rods: checkLicenceType(licences, 'Trout and coarse, up to 3 rods'),
    salmonAndSeaTrout: checkLicenceType(licences, 'Salmon and sea trout')
  }
}

const checkLicenceType = (licences, type) => {
  licences.forEach(licence => {
    if (licence.type === type) {
      return true
    }
  })

  return false
}

const priceCalculation = licences => {
  const price = licences.reduce((accumulator, licence) => accumulator + licence.price, 0)

  return price > 0
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)

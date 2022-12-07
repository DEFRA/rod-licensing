import pageRoute from '../../routes/page-route.js'
import Joi from 'joi'
import { TERMS_AND_CONDITIONS, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../uri.js'
import { nextPage } from '../../routes/next-page.js'
import { licenceTypeDisplay } from '../../processors/licence-type-display.js'
import { LICENCE_TYPE } from '../../processors/mapping-constants.js'
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
    troutAndCoarse2Rods: checkLicenceType(transaction, LICENCE_TYPE['trout-and-coarse'], '2'),
    troutAndCoarse3Rods: checkLicenceType(transaction, LICENCE_TYPE['trout-and-coarse'], '3'),
    salmonAndSeaTrout: checkLicenceType(transaction, LICENCE_TYPE['salmon-and-sea-trout'], '1')
  }
}

const checkLicenceType = (transaction, type, rods) => {
  const example = transaction.permissions[0]
  const testRods = example.numberOfRods === rods
  console.log('rods: ', rods)
  console.log(testRods)
  return transaction.permissions.some(p => p.licenceType === type && p.numberOfRods === rods)
}

const priceCalculation = licences => {
  const price = licences.reduce((accumulator, licence) => accumulator + licence.price, 0)

  return price > 0
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(TERMS_AND_CONDITIONS.page, TERMS_AND_CONDITIONS.uri, validator, nextPage, getData)

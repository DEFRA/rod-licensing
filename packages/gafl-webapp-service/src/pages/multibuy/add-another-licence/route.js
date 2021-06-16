import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { ADD_ANOTHER_LICENCE, CONTACT_SUMMARY, LICENCE_SUMMARY } from '../../../uri.js'
import { nextPage } from '../../../routes/next-page.js'

import GetDataRedirect from '../../../handlers/get-data-redirect.js'

const getData = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  if (!status[LICENCE_SUMMARY.page]) {
    throw new GetDataRedirect(LICENCE_SUMMARY.uri)
  }

  if (!status[CONTACT_SUMMARY.page]) {
    throw new GetDataRedirect(CONTACT_SUMMARY.uri)
  }

  const transaction = await request.cache().helpers.transaction.get()

  return { numberOfLicences: transaction.permissions.length }
}

const validator = Joi.object({
  agree: Joi.string()
    .valid('yes', 'no')
    .required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(ADD_ANOTHER_LICENCE.page, ADD_ANOTHER_LICENCE.uri, validator, nextPage, getData)
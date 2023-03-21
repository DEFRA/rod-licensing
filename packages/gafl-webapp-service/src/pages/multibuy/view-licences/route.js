import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { ADD_LICENCE, LICENCE_FOR, VIEW_LICENCES } from '../../../uri.js'
import { licenceTypeDisplay, licenceTypeAndLengthDisplay } from '../../../processors/licence-type-display.js'
import { displayStartTime } from '../../../processors/date-and-time-display.js'
import { nextPage } from '../../../routes/next-page.js'
import { hasDuplicates } from '../../../processors/multibuy-processor.js'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'

export const getData = async request => {
  const transaction = await request.cache().helpers.transaction.get()
  const mssgs = request.i18n.getCatalog()
  const licencesRemaining = transaction.permissions[0].licensee.firstName !== undefined

  if (licencesRemaining) {
    const licences = transaction.permissions.map((permission, index) => ({
      licenceHolder: `${permission.licensee.firstName} ${permission.licensee.lastName}`,
      type: licenceTypeDisplay(permission, mssgs),
      length: licenceTypeAndLengthDisplay(permission, mssgs),
      start: displayStartTime(request, permission),
      price: permission.permit.cost,
      index
    }))

    const duplicate = await hasDuplicates(licences)

    return {
      duplicate,
      licences,
      licencesRemaining,
      uri: {
        add_licence: addLanguageCodeToUri(request, ADD_LICENCE.uri)
      }
    }
  }
  return {
    duplicate: false,
    licences: undefined,
    licencesRemaining,
    uri: {
      licence_for: addLanguageCodeToUri(request, LICENCE_FOR.uri)
    }
  }
}

export const validator = Joi.object({
  agree: Joi.string().valid('yes').required()
}).options({ abortEarly: false, allowUnknown: true })

export default pageRoute(VIEW_LICENCES.page, VIEW_LICENCES.uri, validator, nextPage, getData)

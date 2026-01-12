import { IDENTIFY, NEW_TRANSACTION, AUTHENTICATE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator, getDateErrorFlags, getDobErrorMessage } from '../../../schema/validators/validators.js'
import { runValidators } from '../../../utils/validators.js'

export const getData = async request => {
  const permission = await request.cache().helpers.status.getCurrentPermission()
  const page = await request.cache().helpers.page.getCurrentPermission(IDENTIFY.page)

  await validatePermissionNumberHelper(permission, request)
  const error = page?.error || {}
  const dobErrorMessage = getDobErrorMessage(error, request.i18n.getCatalog())
  const pageData = {
    referenceNumber: permission.referenceNumber,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    },
    ...getDateErrorFlags(page?.error),
    dobErrorMessage
  }
  if (page?.error) {
    const [errorKey] = Object.keys(page.error)
    const errorValue = page.error[errorKey]
    pageData.error = { errorKey, errorValue }
  }
  return pageData
}

const validatePermissionNumberHelper = async (permission, request) => {
  if (permission.referenceNumber) {
    const result = validation.permission.permissionNumberUniqueComponentValidator(Joi).validate(permission.referenceNumber)
    if (result.error) {
      request.cache().helpers.status.setCurrentPermission({ referenceNumber: null })
      throw new GetDataRedirect(addLanguageCodeToUri(request, IDENTIFY.uri))
    }
  }
}


export const validator = payload => {
  runValidators(
    [
      p =>
        Joi.assert(
          {
            postcode: p.postcode,
            referenceNumber: p.referenceNumber
          },
          Joi.object({
            referenceNumber: validation.permission.permissionNumberUniqueComponentValidator(Joi),
            postcode: validation.contact.createOverseasPostcodeValidator(Joi)
          }).options({ abortEarly: false })
        ),
      dateOfBirthValidator
    ],
    payload
  )
}

export default pageRoute(IDENTIFY.page, IDENTIFY.uri, validator, request => addLanguageCodeToUri(request, AUTHENTICATE.uri), getData)

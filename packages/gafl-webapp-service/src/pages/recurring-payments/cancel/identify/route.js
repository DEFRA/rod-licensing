import { CANCEL_RP_AUTHENTICATE, CANCEL_RP_IDENTIFY, NEW_TRANSACTION } from '../../../../uri.js'
import pageRoute from '../../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { addLanguageCodeToUri } from '../../../../processors/uri-helper.js'
import GetDataRedirect from '../../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../../schema/validators/validators.js'

export const getData = async request => {
  const permission = await request.cache().helpers.status.getCurrentPermission()
  const page = await request.cache().helpers.page.getCurrentPermission(CANCEL_RP_IDENTIFY.page)

  if (permission.referenceNumber) {
    const validatePermissionNumber = validation.permission
      .permissionNumberUniqueComponentValidator(Joi)
      .validate(permission.referenceNumber)
    if (validatePermissionNumber.error) {
      await request.cache().helpers.status.setCurrentPermission({ referenceNumber: null })
      throw new GetDataRedirect(addLanguageCodeToUri(request, CANCEL_RP_IDENTIFY.uri))
    }
  }

  const pageData = {
    referenceNumber: permission.referenceNumber,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    },
    ...getDateErrorFlags(page?.error)
  }

  if (page?.error) {
    const [errorKey] = Object.keys(page.error)
    const errorValue = page.error[errorKey]
    pageData.error = { errorKey, errorValue }
  }

  return pageData
}

export const validator = payload => {
  dateOfBirthValidator(payload)

  Joi.assert(
    {
      postcode: payload.postcode,
      referenceNumber: payload.referenceNumber
    },
    Joi.object({
      referenceNumber: validation.permission.permissionNumberUniqueComponentValidator(Joi),
      postcode: validation.contact.createOverseasPostcodeValidator(Joi)
    }).options({ abortEarly: false })
  )
}

export default pageRoute(
  CANCEL_RP_IDENTIFY.page,
  CANCEL_RP_IDENTIFY.uri,
  () => {},
  request => {
    return addLanguageCodeToUri(request, CANCEL_RP_AUTHENTICATE.uri)
  },
  () => {}
)

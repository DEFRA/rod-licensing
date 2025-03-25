import { IDENTIFY, AUTHENTICATE, NEW_TRANSACTION, LICENCE_NOT_FOUND } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../schema/validators/validators.js'

export const getData = async request => {
  // If we are supplied a permission number, validate it or throw 400
  const permission = await request.cache().helpers.status.getCurrentPermission()
  const page = await request.cache().helpers.page.getCurrentPermission(IDENTIFY.page)

  if (permission.referenceNumber) {
    const validatePermissionNumber = validation.permission
      .permissionNumberUniqueComponentValidator(Joi)
      .validate(permission.referenceNumber)
    if (validatePermissionNumber.error) {
      await request.cache().helpers.status.setCurrentPermission({ referenceNumber: null })
      throw new GetDataRedirect(addLanguageCodeToUri(request, IDENTIFY.uri))
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

// function to determine redirect after submission
export const identifyNextPage = async request => {
  const permission = await request.cache().helpers.status.getCurrentPermission()
  console.log('identifyNextPage - Permission object:', permission)

  if (!permission.referenceNumber) {
    // maybe permission.licenceNumber
    console.log('identifyNextPage - No referenceNumber found. Redirecting to LICENCE_NOT_FOUND.')
    return addLanguageCodeToUri(request, LICENCE_NOT_FOUND.uri)
  }

  console.log('identifyNextPage - ReferenceNumber found:', permission.referenceNumber, '. Redirecting to AUTHENTICATE.')
  return addLanguageCodeToUri(request, AUTHENTICATE.uri)
}

export default pageRoute(IDENTIFY.page, IDENTIFY.uri, validator, identifyNextPage, getData)

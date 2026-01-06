import { IDENTIFY, NEW_TRANSACTION, AUTHENTICATE } from '../../../uri.js'
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
  let joiError = null;
  let dobError = null;

  try {
    Joi.assert(
      {
        postcode: payload.postcode,
        referenceNumber: payload.referenceNumber
      },
      Joi.object({
        referenceNumber: validation.permission.permissionNumberUniqueComponentValidator(Joi),
        postcode: validation.contact.createOverseasPostcodeValidator(Joi)
      }).options({ abortEarly: false })
    );
  } catch (err) {
    joiError = err;
  }

  try {
    dateOfBirthValidator(payload);
  } catch (err) {
    dobError = err;
  }

  if (joiError && dobError) {
    const mergedDetails = [
      ...(Array.isArray(joiError.details) ? joiError.details : []),
      ...(Array.isArray(dobError.details) ? dobError.details : [])
    ];
    const error = new Error('expected error');
    error.details = mergedDetails;
    throw error;
  }

  if (joiError) throw joiError;
  if (dobError) throw dobError;
}

export default pageRoute(IDENTIFY.page, IDENTIFY.uri, validator, request => addLanguageCodeToUri(request, AUTHENTICATE.uri), getData)

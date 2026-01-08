import { IDENTIFY, NEW_TRANSACTION, AUTHENTICATE } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateOfBirthValidator, getDateErrorFlags } from '../../../schema/validators/validators.js'
import { runValidators } from '../../../utils/validators.js'

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

  const error = page?.error || {}
  const DATE_RANGE = 'date-range'
  const errorMap = {
    'full-date': {
      'object.missing': { text: request.i18n.getCatalog().dob_error }
    },
    'day-and-month': {
      'object.missing': { text: request.i18n.getCatalog().dob_error_missing_day_and_month }
    },
    'day-and-year': {
      'object.missing': { text: request.i18n.getCatalog().dob_error_missing_day_and_year }
    },
    'month-and-year': {
      'object.missing': { text: request.i18n.getCatalog().dob_error_missing_month_and_year }
    },
    day: {
      'any.required': { text: request.i18n.getCatalog().dob_error_missing_day }
    },
    month: {
      'any.required': { text: request.i18n.getCatalog().dob_error_missing_month }
    },
    year: {
      'any.required': { text: request.i18n.getCatalog().dob_error_missing_year }
    },
    'non-numeric': {
      'number.base': { text: request.i18n.getCatalog().dob_error_non_numeric }
    },
    'invalid-date': {
      'any.custom': { text: request.i18n.getCatalog().dob_error_date_real }
    },
    [DATE_RANGE]: {
      'date.min': { text: request.i18n.getCatalog().dob_error_year_min },
      'date.max': { text: request.i18n.getCatalog().dob_error_year_max }
    }
  }

  const dobErrorMessage = (() => {
    const errorTypes = [
      ['full-date'],
      ['day-and-month'],
      ['day-and-year'],
      ['month-and-year'],
      ['day'],
      ['month'],
      ['year'],
      ['non-numeric'],
      ['invalid-date'],
      [DATE_RANGE, 'date.min'],
      [DATE_RANGE, 'date.max']
    ]
    // Avoid shadowing by using different variable names in the callback
    const found = errorTypes.find(([errType, errSubType]) => {
      if (errType === DATE_RANGE) {
        return error[errType] === errSubType && errorMap[errType]?.[errSubType]
      }
      return error[errType] && errorMap[errType]?.[error[errType]]
    })
    if (!found) {
      return undefined
    }
    const [foundType, foundSubType] = found
    if (foundType === DATE_RANGE) {
      return { text: errorMap[foundType]?.[foundSubType]?.text }
    }
    return { text: errorMap[foundType]?.[error[foundType]]?.text }
  })()

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

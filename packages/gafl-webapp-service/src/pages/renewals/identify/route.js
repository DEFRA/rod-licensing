import { IDENTIFY, AUTHENTICATE, NEW_TRANSACTION } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import Joi from 'joi'
import { validation } from '@defra-fish/business-rules-lib'
import { addLanguageCodeToUri } from '../../../processors/uri-helper.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'

const MAX_AGE = 120

export const getData = async request => {
  // If we are supplied a permission number, validate it or throw 400
  const permission = await request.cache().helpers.status.getCurrentPermission()

  if (permission.referenceNumber) {
    const validatePermissionNumber = validation.permission
      .permissionNumberUniqueComponentValidator(Joi)
      .validate(permission.referenceNumber)
    if (validatePermissionNumber.error) {
      await request.cache().helpers.status.setCurrentPermission({ referenceNumber: null })
      throw new GetDataRedirect(addLanguageCodeToUri(request, IDENTIFY.uri))
    }
  }

  return {
    referenceNumber: permission.referenceNumber,
    uri: {
      new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri)
    }
  }
}

const validator = async payload => {
  const maxYear = new Date().getFullYear()
  const minYear = maxYear - MAX_AGE

  const day = payload['date-of-birth-day'] || undefined
  const month = payload['date-of-birth-month'] || undefined
  const year = payload['date-of-birth-year'] || undefined
  const dateOfBirth = {
    day: parseInt(payload['date-of-birth-day']),
    month: parseInt(payload['date-of-birth-month']),
    year: parseInt(payload['date-of-birth-year'])
  }

  Joi.assert(
    {
      day,
      month,
      year,
      'date-of-birth': dateOfBirth,
      postcode: payload.postcode,
      referenceNumber: payload.referenceNumber
    },
    Joi.object({
      referenceNumber: validation.permission.permissionNumberUniqueComponentValidator(Joi),
      postcode: validation.contact.createOverseasPostcodeValidator(Joi),
      day: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
      month: Joi.any().required().concat(validation.date.createMonthValidator(Joi)),
      year: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear)),
      'date-of-birth': Joi.when(
        Joi.object({
          day: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
          month: Joi.any().required().concat(validation.date.createMonthValidator(Joi)),
          year: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear))
        }).unknown(),
        {
          then: validation.date.createRealDateValidator(Joi)
        }
      )
    }).options({ abortEarly: false, allowUnknown: true })
  )
}

export default pageRoute(IDENTIFY.page, IDENTIFY.uri, validator, request => addLanguageCodeToUri(request, AUTHENTICATE.uri), getData)

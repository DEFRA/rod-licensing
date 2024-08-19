import { DATE_OF_BIRTH, LICENCE_FOR } from '../../../uri.js'
import Joi from 'joi'
import pageRoute from '../../../routes/page-route.js'
import { validation } from '@defra-fish/business-rules-lib'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'

const MAX_AGE = 120

export const validator = payload => {
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
      'date-of-birth': dateOfBirth
    },
    Joi.object({
      day: Joi.any().required().concat(validation.date.createDayValidator(Joi)),
      month: Joi.any().required().concat(validation.date.createMonthValidator(Joi)),
      year: Joi.any().required().concat(validation.date.createYearValidator(Joi, minYear, maxYear)),
      'date-of-birth': validation.date.createRealDateValidator(Joi)
    }).options({ abortEarly: false })
  )
}

const redirectToStartOfJourney = status => {
  if (!status[LICENCE_FOR.page]) {
    throw new GetDataRedirect(LICENCE_FOR.uri)
  }
}

export const getData = async request => {
  const { isLicenceForYou } = await request.cache().helpers.transaction.getCurrentPermission()
  const status = await request.cache().helpers.status.getCurrentPermission()

  redirectToStartOfJourney(status)

  return { isLicenceForYou }
}

export default pageRoute(DATE_OF_BIRTH.page, DATE_OF_BIRTH.uri, validator, nextPage, getData)

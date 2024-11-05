import { DATE_OF_BIRTH, LICENCE_FOR } from '../../../uri.js'
import Joi from 'joi'
import pageRoute from '../../../routes/page-route.js'
// import { validation } from '@defra-fish/business-rules-lib'
import { nextPage } from '../../../routes/next-page.js'
import GetDataRedirect from '../../../handlers/get-data-redirect.js'
import { dateSchema, dateSchemaInput } from '../../../schema/date.schema.js'

const MAX_AGE = 120

export const validator = payload => {
  const maxYear = new Date().getFullYear()
  const minYear = maxYear - MAX_AGE

  const day = payload['date-of-birth-day']
  const month = payload['date-of-birth-month']
  const year = payload['date-of-birth-year']

  Joi.assert(dateSchemaInput(day, month, year), dateSchema)
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

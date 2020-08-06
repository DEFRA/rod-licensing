import Joi from '@hapi/joi'
import moment from 'moment'
import JoiDate from '@hapi/joi-date'
import { ADVANCED_PURCHASE_MAX_DAYS } from '@defra-fish/business-rules-lib'
import { LICENCE_TO_START, CONTROLLER } from '../../../uri.js'
import pageRoute from '../../../routes/page-route.js'
import { dateFormats } from '../../../constants.js'

const JoiX = Joi.extend(JoiDate)

const schema = Joi.object({
  'licence-to-start': Joi.string()
    .valid('after-payment', 'another-date')
    .required(),
  'licence-start-date': Joi.alternatives().conditional('licence-to-start', {
    is: 'another-date',
    then: JoiX.date()
      .format(dateFormats)
      .min(moment().add(-1, 'days'))
      .max(moment().add(ADVANCED_PURCHASE_MAX_DAYS, 'days'))
      .required(),
    otherwise: Joi.string().empty('')
  })
}).options({ abortEarly: false, allowUnknown: true })

const validator = payload => {
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert(
    {
      'licence-start-date': licenceStartDate,
      'licence-to-start': payload['licence-to-start']
    },
    schema
  )
}

const getData = () => ({
  exampleStartDate: moment()
    .add(1, 'days')
    .format('DD MM YYYY'),
  maxStartDate: moment()
    .add(ADVANCED_PURCHASE_MAX_DAYS, 'days')
    .format('DD MM YYYY'),
  advancedPurchaseMaxDays: ADVANCED_PURCHASE_MAX_DAYS
})

export default pageRoute(LICENCE_TO_START.page, LICENCE_TO_START.uri, validator, CONTROLLER.uri, getData)

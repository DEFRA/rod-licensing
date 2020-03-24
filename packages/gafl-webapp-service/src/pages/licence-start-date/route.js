'use strict'

import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'
import JoiDate from '@hapi/joi-date'
import moment from 'moment'
const JoiX = Joi.extend(JoiDate)

const formats = ['YYYY-MM-DD', 'YY-MM-DD', 'YYYY-M-DD', 'YY-M-DD', 'YYYY-MM-D', 'YY-MM-D', 'YYYY-M-D', 'YY-M-D']

const schema = Joi.object({
  'licence-start-date': JoiX.date()
    .format(formats)
    .min('now')
    .max(moment().add(60, 'days'))
    .required()
})

const validator = payload => {
  const licenceStartDate = `${payload['licence-start-date-year']}-${payload['licence-start-date-month']}-${payload['licence-start-date-day']}`
  Joi.assert({ 'licence-start-date': licenceStartDate }, schema)
}

const getData = () => ({
  maxStartDate: moment()
    .add(1, 'days')
    .format('DD MM YYYY')
})

export default pageRoute('licence-start-date', '/buy/start-date', validator, '/buy', getData)

import pageRoute from '../../routes/page-route.js'
import Joi from '@hapi/joi'
import moment from 'moment'
import transactionHelper from '../../lib/transaction-helper.js'

const hours = Array(24)
  .fill(0)
  .map((e, idx) => idx.toString())

const validator = Joi.object({
  'licence-start-time': Joi.string()
    .valid(...hours)
    .required()
}).options({ abortEarly: false, allowUnknown: true })

const getData = async request => {
  const permission = await transactionHelper.getPermission(request)
  const startDateStr = moment(permission.licenceStartDate, 'YYYY-MM-DD').format('dddd, Do MMMM, YYYY')
  return { startDateStr }
}

export default pageRoute('licence-start-time', '/buy/start-time', validator, '/buy', getData)

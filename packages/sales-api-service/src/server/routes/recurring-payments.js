import { getRecurringPayments } from '../../services/recurring-payments.service.js'
export default [
  {
    method: 'GET',
    path: '/test',
    handler: async (request, h) => {
      const { date } = request.params
      const result = await getRecurringPayments(date)
      return h.response(result)
    }
  }
]

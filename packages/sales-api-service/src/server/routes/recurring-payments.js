import { getRecurringPayments } from '../../services/recurring-payments.service.js'
export default [
  {
    method: 'GET',
    path: '/dueRecurringPayments/{date}',
    handler: async (request, h) => {
      const { date } = request.params
      console.log(date)
      const result = await getRecurringPayments(date)
      return h.response(result)
    }
  }
]

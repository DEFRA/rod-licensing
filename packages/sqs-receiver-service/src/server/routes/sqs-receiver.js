import receiver from '../../receiver.js'

export default [
  {
    method: 'POST',
    path: '/receiver',
    options: {
      handler: async () => {
        await receiver()
      },
      description: 'Generate a recurring payment record',
      tags: ['api', 'recurring-payments'],
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Recurring payment record generated successfully' }
          },
          order: 2
        }
      }
    }
  }
]

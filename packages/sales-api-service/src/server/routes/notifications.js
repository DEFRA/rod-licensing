import {
  notificationsDateRequestParamsSchema,
  notificationStatusRequestParamsSchema,
  createNotificationStatusRequestSchema
} from '../../schema/notifications.schema.js'
import {
  getPermissionsExpiringOnDate,
  getPermissionsExpiredOnDate,
  getNotificationStatus,
  createNotificationStatus
} from '../../services/notifications.service.js'

const SWAGGER_TAGS = ['api', 'notifications']

export default [
  {
    method: 'GET',
    path: '/notifications/expiring/{date}',
    options: {
      handler: async (request, h) => {
        const { date } = request.params
        const result = await getPermissionsExpiringOnDate(date)
        return h.response(result)
      },
      description: 'Retrieve permissions expiring on the specified date',
      tags: SWAGGER_TAGS,
      validate: {
        params: notificationsDateRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Permissions expiring on date' }
          },
          order: 1
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/notifications/expired/{date}',
    options: {
      handler: async (request, h) => {
        const { date } = request.params
        const result = await getPermissionsExpiredOnDate(date)
        return h.response(result)
      },
      description: 'Retrieve permissions that expired on the specified date',
      tags: SWAGGER_TAGS,
      validate: {
        params: notificationsDateRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Permissions expired on date' }
          },
          order: 2
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/notifications/status/{permissionId}/{notificationType}',
    options: {
      handler: async (request, h) => {
        const { permissionId, notificationType } = request.params
        const result = await getNotificationStatus(permissionId, notificationType)
        return h.response(result || h.response().code(204))
      },
      description: 'Check if a notification has already been sent for a permission',
      tags: SWAGGER_TAGS,
      validate: {
        params: notificationStatusRequestParamsSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            200: { description: 'Notification status found' },
            204: { description: 'No notification sent for this permission/type' }
          },
          order: 3
        }
      }
    }
  },
  {
    method: 'POST',
    path: '/notifications/status',
    options: {
      handler: async (request, h) => {
        const result = await createNotificationStatus(request.payload)
        return h.response(result).code(201)
      },
      description: 'Record a notification as sent',
      tags: SWAGGER_TAGS,
      validate: {
        payload: createNotificationStatusRequestSchema
      },
      plugins: {
        'hapi-swagger': {
          responses: {
            201: { description: 'Notification status recorded' }
          },
          order: 4
        }
      }
    }
  }
]

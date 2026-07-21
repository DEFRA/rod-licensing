import Joi from 'joi'

export const notificationsDateRequestParamsSchema = Joi.object({
  date: Joi.string().isoDate().required()
})

export const notificationStatusRequestParamsSchema = Joi.object({
  permissionId: Joi.string().guid().required(),
  notificationType: Joi.string().valid('expiry_reminder', 'expired_notice').required()
})

export const createNotificationStatusRequestSchema = Joi.object({
  permissionId: Joi.string().guid().required(),
  contactId: Joi.string().guid().required(),
  notificationType: Joi.string().valid('expiry_reminder', 'expired_notice').required(),
  notifyReference: Joi.string().required(),
  status: Joi.string().valid('sent', 'failed').required(),
  method: Joi.string().valid('email', 'sms', 'letter').required()
})

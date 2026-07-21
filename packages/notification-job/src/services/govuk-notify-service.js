'use strict'
import { govUkNotifyApi } from '@defra-fish/connectors-lib'
import db from 'debug'
const debug = db('notification:notify-service')

const NOTIFICATION_METHOD = {
  EMAIL: 'email',
  SMS: 'sms',
  LETTER: 'letter'
}

const PREFERRED_METHOD_OF_REMINDER = {
  EMAIL: 910400000,
  LETTER: 910400001,
  TEXT: 910400002,
  DO_NOT_CONTACT: 910400003
}

export { NOTIFICATION_METHOD, PREFERRED_METHOD_OF_REMINDER }

export const sendNotification = async (contact, permission, notificationType, method) => {
  const personalisation = buildPersonalisation(contact, permission)
  const reference = `${permission.entity.id}-${notificationType}`

  switch (method) {
    case NOTIFICATION_METHOD.EMAIL:
      return sendEmailNotification(contact, notificationType, personalisation, reference)
    case NOTIFICATION_METHOD.SMS:
      return sendSmsNotification(contact, notificationType, personalisation, reference)
    case NOTIFICATION_METHOD.LETTER:
      return sendLetterNotification(contact, notificationType, personalisation, reference)
    default:
      throw new Error(`Unsupported notification method: ${method}`)
  }
}

const sendEmailNotification = async (contact, notificationType, personalisation, reference) => {
  const templateId = getEmailTemplateId(notificationType)
  const emailAddress = contact.entity.email
  debug('Sending email notification to %s, template: %s, reference: %s', emailAddress, templateId, reference)
  const response = await govUkNotifyApi.sendEmail(templateId, emailAddress, { personalisation, reference })
  return response.data.id
}

const sendSmsNotification = async (contact, notificationType, personalisation, reference) => {
  const templateId = getSmsTemplateId(notificationType)
  const phoneNumber = contact.entity.mobilePhone
  debug('Sending SMS notification to %s, template: %s, reference: %s', phoneNumber, templateId, reference)
  const response = await govUkNotifyApi.sendSms(templateId, phoneNumber, { personalisation, reference })
  return response.data.id
}

const sendLetterNotification = async (contact, notificationType, personalisation, reference) => {
  const templateId = getLetterTemplateId(notificationType)
  const letterPersonalisation = {
    ...personalisation,
    address_line_1: `${contact.entity.firstName} ${contact.entity.lastName}`,
    address_line_2: contact.entity.premises || contact.entity.street || '',
    address_line_3: contact.entity.street && contact.entity.premises ? contact.entity.street : '',
    address_line_4: contact.entity.locality || '',
    address_line_5: contact.entity.town || '',
    address_line_6: contact.entity.postcode || ''
  }
  debug('Sending letter notification, template: %s, reference: %s', templateId, reference)
  const response = await govUkNotifyApi.sendLetter(templateId, { personalisation: letterPersonalisation, reference })
  return response.data.id
}

const buildPersonalisation = (contact, permission) => ({
  first_name: contact.entity.firstName,
  last_name: contact.entity.lastName,
  licence_number: permission.entity.referenceNumber,
  expiry_date: formatDate(permission.entity.endDate)
})

const formatDate = isoDateString => {
  const date = new Date(isoDateString)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

const getEmailTemplateId = notificationType => {
  if (notificationType === 'expiry_reminder') {
    return process.env.GOV_NOTIFY_EXPIRY_REMINDER_EMAIL_TEMPLATE_ID
  }
  return process.env.GOV_NOTIFY_EXPIRED_NOTICE_EMAIL_TEMPLATE_ID
}

const getSmsTemplateId = notificationType => {
  if (notificationType === 'expiry_reminder') {
    return process.env.GOV_NOTIFY_EXPIRY_REMINDER_SMS_TEMPLATE_ID
  }
  return process.env.GOV_NOTIFY_EXPIRED_NOTICE_SMS_TEMPLATE_ID
}

const getLetterTemplateId = notificationType => {
  if (notificationType === 'expiry_reminder') {
    return process.env.GOV_NOTIFY_EXPIRY_REMINDER_LETTER_TEMPLATE_ID
  }
  return process.env.GOV_NOTIFY_EXPIRED_NOTICE_LETTER_TEMPLATE_ID
}

export const getNotificationMethod = preferredMethodOfReminder => {
  const methodId = preferredMethodOfReminder?.id
  switch (methodId) {
    case PREFERRED_METHOD_OF_REMINDER.EMAIL:
      return NOTIFICATION_METHOD.EMAIL
    case PREFERRED_METHOD_OF_REMINDER.TEXT:
      return NOTIFICATION_METHOD.SMS
    case PREFERRED_METHOD_OF_REMINDER.LETTER:
      return NOTIFICATION_METHOD.LETTER
    default:
      return null
  }
}

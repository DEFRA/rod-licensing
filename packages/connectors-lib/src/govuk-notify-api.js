'use strict'

let client = null

const getClient = async () => {
  if (!client) {
    const { NotifyClient } = await import('notifications-node-client')
    client = new NotifyClient(process.env.GOV_NOTIFY_API_KEY)
  }
  return client
}

export const sendEmail = async (templateId, emailAddress, options = {}) => {
  try {
    const notifyClient = await getClient()
    return await notifyClient.sendEmail(templateId, emailAddress, options)
  } catch (err) {
    console.error(`Error sending email via GOV.UK Notify - templateId: ${templateId}, email: ${emailAddress}`, err)
    throw err
  }
}

export const sendSms = async (templateId, phoneNumber, options = {}) => {
  try {
    const notifyClient = await getClient()
    return await notifyClient.sendSms(templateId, phoneNumber, options)
  } catch (err) {
    console.error(`Error sending SMS via GOV.UK Notify - templateId: ${templateId}, phone: ${phoneNumber}`, err)
    throw err
  }
}

export const sendLetter = async (templateId, options = {}) => {
  try {
    const notifyClient = await getClient()
    return await notifyClient.sendLetter(templateId, options)
  } catch (err) {
    console.error(`Error sending letter via GOV.UK Notify - templateId: ${templateId}`, err)
    throw err
  }
}

export const getNotificationById = async notificationId => {
  try {
    const notifyClient = await getClient()
    return await notifyClient.getNotificationById(notificationId)
  } catch (err) {
    console.error(`Error retrieving notification status from GOV.UK Notify - notificationId: ${notificationId}`, err)
    throw err
  }
}

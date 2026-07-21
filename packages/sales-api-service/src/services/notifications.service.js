'use strict'
import {
  executeQuery,
  executePagedQuery,
  findById,
  persist,
  Contact,
  Permission,
  NotificationStatus,
  permissionsExpiringOnDate,
  permissionsExpiredOnDate,
  notificationStatusForPermission
} from '@defra-fish/dynamics-lib'
import db from 'debug'
const debug = db('sales:notifications')

export const getPermissionsExpiringOnDate = async date => {
  debug('Fetching permissions expiring on %s', date)
  const results = []
  await executePagedQuery(permissionsExpiringOnDate(date), page => {
    results.push(...page)
  })
  return results
}

export const getPermissionsExpiredOnDate = async date => {
  debug('Fetching permissions expired on %s', date)
  const results = []
  await executePagedQuery(permissionsExpiredOnDate(date), page => {
    results.push(...page)
  })
  return results
}

export const getNotificationStatus = async (permissionId, notificationType) => {
  debug('Checking notification status for permission %s, type %s', permissionId, notificationType)
  const results = await executeQuery(notificationStatusForPermission(permissionId, notificationType))
  return results.length > 0 ? results[0] : null
}

export const createNotificationStatus = async ({ permissionId, contactId, notificationType, notifyReference, status, method }) => {
  debug('Creating notification status record for permission %s, type %s', permissionId, notificationType)
  const permission = await findById(Permission, permissionId)
  const contact = await findById(Contact, contactId)

  const notificationStatus = new NotificationStatus()
  notificationStatus.notificationType = notificationType
  notificationStatus.sentAt = new Date().toISOString()
  notificationStatus.notifyReference = notifyReference
  notificationStatus.status = status
  notificationStatus.method = method
  notificationStatus.bindToEntity(NotificationStatus.definition.relationships.permission, permission)
  notificationStatus.bindToEntity(NotificationStatus.definition.relationships.contact, contact)
  await persist([notificationStatus])
  return notificationStatus
}

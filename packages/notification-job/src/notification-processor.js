'use strict'
import moment from 'moment-timezone'
import { SERVICE_LOCAL_TIME } from '@defra-fish/business-rules-lib'
import { salesApi, airbrake, DistributedLock } from '@defra-fish/connectors-lib'
import { sendNotification, getNotificationMethod } from './services/govuk-notify-service.js'
import db from 'debug'

const debug = db('notification:processor')

const SIGINT_CODE = 130
const SIGTERM_CODE = 137
const LOCK_TTL_MS = 5 * 60 * 1000
const EXPIRY_REMINDER_DAYS = 30
const EXPIRED_NOTICE_DAYS = 1

const lock = new DistributedLock('notification-etl', LOCK_TTL_MS)

export const execute = async () => {
  airbrake.initialise()
  try {
    await lock.obtainAndExecute({
      onLockObtained: async () => {
        await processNotifications()
      },
      onLockError: async e => {
        console.log('Unable to obtain a lock for the notification job, skipping execution.', e)
        process.exit(0)
      },
      maxWaitSeconds: 0
    })
  } catch (e) {
    console.error(e)
  } finally {
    await airbrake.flush()
  }
}

const processNotifications = async () => {
  if (process.env.RUN_NOTIFICATION_JOB?.toLowerCase() !== 'true') {
    debug('Notification job disabled')
    return
  }

  debug('Notification job enabled, processing notifications')

  const today = moment.tz(SERVICE_LOCAL_TIME)
  const expiryReminderDate = today.clone().add(EXPIRY_REMINDER_DAYS, 'days').format('YYYY-MM-DD')
  const expiredNoticeDate = today.clone().subtract(EXPIRED_NOTICE_DAYS, 'days').format('YYYY-MM-DD')

  debug('Processing expiry reminders for date: %s', expiryReminderDate)
  await processExpiryReminders(expiryReminderDate)

  debug('Processing expired notices for date: %s', expiredNoticeDate)
  await processExpiredNotices(expiredNoticeDate)

  debug('Notification processing complete')
}

const processExpiryReminders = async date => {
  const permissions = await salesApi.getPermissionsExpiringOnDate(date)
  debug('Found %d eligible permissions expiring on %s', permissions.length, date)
  await sendNotificationsForPermissions(permissions, 'expiry_reminder')
}

const processExpiredNotices = async date => {
  const permissions = await salesApi.getPermissionsExpiredOnDate(date)
  debug('Found %d eligible permissions expired on %s', permissions.length, date)
  await sendNotificationsForPermissions(permissions, 'expired_notice')
}

const sendNotificationsForPermissions = async (permissions, notificationType) => {
  const results = await Promise.allSettled(permissions.map(permission => sendNotificationForPermission(permission, notificationType)))

  const failures = results.filter(r => r.status === 'rejected')
  if (failures.length) {
    console.error(`${failures.length} notification(s) failed to send for type: ${notificationType}`, ...failures.map(f => f.reason))
  }

  const successes = results.filter(r => r.status === 'fulfilled' && r.value === true)
  debug('%d notifications sent successfully for type: %s', successes.length, notificationType)
}

const sendNotificationForPermission = async (permission, notificationType) => {
  const contact = permission.expanded?.licensee
  if (!contact) {
    debug('No contact found for permission %s, skipping', permission.entity.id)
    return false
  }

  const method = getNotificationMethod(contact.entity.preferredMethodOfReminder)
  if (!method) {
    debug('No valid notification method for contact %s, skipping', contact.entity.id)
    return false
  }

  if (!hasRequiredContactDetails(contact, method)) {
    debug('Contact %s missing required details for method %s, skipping', contact.entity.id, method)
    return false
  }

  const existingStatus = await salesApi.getNotificationStatus(permission.entity.id, notificationType)
  if (existingStatus) {
    debug('Notification already sent for permission %s, type %s, skipping', permission.entity.id, notificationType)
    return false
  }

  try {
    const notifyReference = await sendNotification(contact, permission, notificationType, method)
    await salesApi.createNotificationStatus({
      permissionId: permission.entity.id,
      contactId: contact.entity.id,
      notificationType,
      notifyReference,
      status: 'sent',
      method
    })
    debug('Notification sent for permission %s via %s', permission.entity.id, method)
    return true
  } catch (err) {
    console.error(`Failed to send notification for permission ${permission.entity.id}:`, err)
    await salesApi.createNotificationStatus({
      permissionId: permission.entity.id,
      contactId: contact.entity.id,
      notificationType,
      notifyReference: '',
      status: 'failed',
      method
    })
    return false
  }
}

const hasRequiredContactDetails = (contact, method) => {
  switch (method) {
    case 'email':
      return !!contact.entity.email
    case 'sms':
      return !!contact.entity.mobilePhone
    case 'letter':
      return !!(contact.entity.premises || contact.entity.street) && !!contact.entity.postcode
    default:
      return false
  }
}

const shutdown = async code => {
  await airbrake.flush()
  await lock.release()
  process.exit(code)
}

process.on('SIGINT', () => shutdown(SIGINT_CODE))
process.on('SIGTERM', () => shutdown(SIGTERM_CODE))

import { BaseEntity, EntityDefinition } from './base.entity.js'
import { Contact } from './contact.entity.js'
import { Permission } from './permission.entity.js'

/**
 * Notification status entity - tracks notifications sent to anglers
 * @extends BaseEntity
 */
export class NotificationStatus extends BaseEntity {
  /** @type {EntityDefinition} */
  static _definition = new EntityDefinition(() => ({
    localName: 'notificationStatus',
    dynamicsCollection: 'defra_notificationstatuses',
    defaultFilter: 'statecode eq 0',
    mappings: {
      id: { field: 'defra_notificationstatusid', type: 'string' },
      notificationType: { field: 'defra_notificationtype', type: 'string' },
      sentAt: { field: 'defra_sentat', type: 'datetime' },
      notifyReference: { field: 'defra_notifyreference', type: 'string' },
      status: { field: 'defra_status', type: 'string' },
      method: { field: 'defra_method', type: 'string' }
    },
    relationships: {
      permission: { property: 'defra_PermissionId', entity: Permission, parent: true },
      contact: { property: 'defra_ContactId', entity: Contact, parent: true }
    }
  }))

  /**
   * The {@link EntityDefinition} providing mappings between Dynamics entity and the local entity
   * @type {EntityDefinition}
   */
  static get definition () {
    return NotificationStatus._definition
  }

  /**
   * The type of notification (e.g. 'expiry_reminder', 'expired_notice')
   * @type {string}
   */
  get notificationType () {
    return super._getState('notificationType')
  }

  set notificationType (notificationType) {
    super._setState('notificationType', notificationType)
  }

  /**
   * The timestamp when the notification was sent
   * @type {string}
   */
  get sentAt () {
    return super._getState('sentAt')
  }

  set sentAt (sentAt) {
    super._setState('sentAt', sentAt)
  }

  /**
   * The Gov.UK Notify reference for the sent notification
   * @type {string}
   */
  get notifyReference () {
    return super._getState('notifyReference')
  }

  set notifyReference (notifyReference) {
    super._setState('notifyReference', notifyReference)
  }

  /**
   * The status of the notification (sent, failed)
   * @type {string}
   */
  get status () {
    return super._getState('status')
  }

  set status (status) {
    super._setState('status', status)
  }

  /**
   * The method used (email, sms, letter)
   * @type {string}
   */
  get method () {
    return super._getState('method')
  }

  set method (method) {
    super._setState('method', method)
  }
}

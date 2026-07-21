import { PredefinedQuery } from './predefined-query.js'
import { Permission } from '../entities/permission.entity.js'
import { Permit } from '../entities/permit.entity.js'
import { Contact } from '../entities/contact.entity.js'
import { NotificationStatus } from '../entities/notification-status.entity.js'

const TWELVE_MONTH_DURATION = 12
const DO_NOT_CONTACT = 910400003

export const permissionsExpiringOnDate = date => {
  const { licensee, permit } = Permission.definition.relationships
  const filter = [
    `Microsoft.Dynamics.CRM.On(PropertyName='defra_enddate',PropertyValue=${date})`,
    `${permit.property}/${Permit.definition.mappings.durationMagnitude.field} eq ${TWELVE_MONTH_DURATION}`,
    `${licensee.property}/${Contact.definition.mappings.preferredMethodOfReminder.field} ne ${DO_NOT_CONTACT}`,
    Permission.definition.defaultFilter
  ].join(' and ')
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit]
  })
}

export const permissionsExpiredOnDate = date => {
  const { licensee, permit } = Permission.definition.relationships
  const filter = [
    `Microsoft.Dynamics.CRM.On(PropertyName='defra_enddate',PropertyValue=${date})`,
    `${permit.property}/${Permit.definition.mappings.durationMagnitude.field} eq ${TWELVE_MONTH_DURATION}`,
    `${licensee.property}/${Contact.definition.mappings.preferredMethodOfReminder.field} ne ${DO_NOT_CONTACT}`,
    Permission.definition.defaultFilter
  ].join(' and ')
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit]
  })
}

export const notificationStatusForPermission = (permissionId, notificationType) => {
  const filter = `defra_PermissionId/defra_permissionid eq '${permissionId}' and defra_notificationtype eq '${notificationType}' and statecode eq 0`
  return new PredefinedQuery({
    root: NotificationStatus,
    filter: filter
  })
}

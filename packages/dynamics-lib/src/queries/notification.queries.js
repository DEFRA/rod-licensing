import { PredefinedQuery } from './predefined-query.js'
import { Permission } from '../entities/permission.entity.js'
import { NotificationStatus } from '../entities/notification-status.entity.js'

export const permissionsExpiringOnDate = date => {
  const { licensee, permit } = Permission.definition.relationships
  const filter = `Microsoft.Dynamics.CRM.On(PropertyName='defra_enddate',PropertyValue=${date}) and ${Permission.definition.defaultFilter}`
  return new PredefinedQuery({
    root: Permission,
    filter: filter,
    expand: [licensee, permit]
  })
}

export const permissionsExpiredOnDate = date => {
  const { licensee, permit } = Permission.definition.relationships
  const filter = `Microsoft.Dynamics.CRM.On(PropertyName='defra_enddate',PropertyValue=${date}) and ${Permission.definition.defaultFilter}`
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

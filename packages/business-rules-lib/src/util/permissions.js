export const getPermissionCost = permission => {
  const permissionStartDate = permission.startDate || new Date().toISOString()
  if (Date.parse(permissionStartDate) >= Date.parse(permission.permit.newCostStartDate)) {
    return permission.permit.newCost
  }
  return permission.permit.cost
}

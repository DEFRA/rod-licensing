export const getPermissionsTotalCost = permissions => {
  return permissions.reduce((runningTotal, permission) => {
    return runningTotal + getPermissionCost(permission)
  }, 0)
}
export const getPermissionCost = permission => {
  if (Date.parse(permission.startDate) >= Date.parse(permission.permit.newCostStartDate)) {
    return permission.permit.newCost
  }
  return permission.permit.cost
}

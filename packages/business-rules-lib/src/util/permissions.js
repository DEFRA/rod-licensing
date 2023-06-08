export const getPermissionCost = (permission, createdDate) => {
  console.log('createdDate', createdDate)
  console.log('startDate', permission.startDate)
  console.log('newDate', new Date().toISOString())
  const permissionStartDate = createdDate || permission.startDate || new Date().toISOString()
  console.log('permissionStartDate', permissionStartDate)
  if (Date.parse(permissionStartDate) >= Date.parse(permission.permit.newCostStartDate)) {
    return permission.permit.newCost
  }
  return permission.permit.cost
}

import { START_AFTER_PAYMENT_MINUTES } from '../constants.js'

const getPermissionStartDate = () => {
  const startDate = new Date()
  startDate.setMinutes(startDate.getMinutes() + START_AFTER_PAYMENT_MINUTES)
  return startDate.toISOString()
}

export const getPermissionCost = (permission, createdDate) => {
  const permissionStartDate = createdDate || permission.startDate || getPermissionStartDate()
  if (Date.parse(permissionStartDate) >= Date.parse(permission.permit.newCostStartDate)) {
    return permission.permit.newCost
  }
  return permission.permit.cost
}

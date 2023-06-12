import { getPermissionCost } from '@defra-fish/business-rules-lib'

export const displayPermissionPrice = (permission, labels, createdDate) => {
  const cost = getPermissionCost(permission, createdDate)
  if (cost === 0) {
    return labels.free
  } else if (Number.isInteger(cost)) {
    return `${labels.pound}${cost}`
  }
  return `${labels.pound}${cost.toFixed(2)}`
}

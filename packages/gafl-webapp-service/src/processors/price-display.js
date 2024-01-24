import { getPermissionCost } from '@defra-fish/business-rules-lib'

export const displayPrice = (price, labels) => {
  if (price === 0) {
    return labels.free
  } else if (Number.isInteger(price)) {
    return `${labels.pound}${price}`
  }
  return `${labels.pound}${price.toFixed(2)}`
}

export const displayPermissionPrice = (permission, labels, createdDate) => {
  return displayPrice(getPermissionCost(permission, createdDate), labels)
}

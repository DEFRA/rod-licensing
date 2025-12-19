export const journeyGoalResults = Object.freeze({
  PURCHASE_PERMISSION: 'purchase-permission',
  RENEW_PERMISSION: 'renew-permission',
  CANCEL_RECURRING_PAYMENT: 'cancel-recurring-payment'
})

const journeyGoalResult = async request => {
  switch (request.payload['journey-goal']) {
    case 'purchase-permission':
      return journeyGoalResults.PURCHASE_PERMISSION
    case 'renew-permission':
      return journeyGoalResults.RENEW_PERMISSION
    case 'cancel-recurring-payment':
      return journeyGoalResults.CANCEL_RECURRING_PAYMENT
    default:
      console.error('Unknown journey goal selected:', request.payload['journey-goal'])
  }
}

export default journeyGoalResult

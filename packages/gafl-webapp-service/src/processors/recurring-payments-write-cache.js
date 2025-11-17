export const setUpRecurringPaymentCache = async (request, recurringPayment) => {
  if (!recurringPayment) return

  const {
    agreementId,
    last_digits_card_number,
    status,
    cancelledDate,
    cancelledReason,
    endDate,
    nextDueDate
  } = recurringPayment

  await request.cache().helpers.status.setCurrentPermission({
    recurringPayment: {
      agreementId,
      lastDigitsCardNumber: last_digits_card_number,
      status,
      cancelledDate,
      cancelledReason,
      endDate,
      nextDueDate
    }
  })
}

export const setUpCancelRpCacheFromAuthenticationResult = async (request, authenticationResult) => {
  const { permission, recurringPayment } = authenticationResult

  await request.cache().helpers.status.setCurrentPermission({
    referenceNumber: permission.referenceNumber,
    permissionSummary: {
      referenceNumber: permission.referenceNumber,
      endDate: permission.endDate
    }
  })

  await setUpRecurringPaymentCache(request, recurringPayment)
}

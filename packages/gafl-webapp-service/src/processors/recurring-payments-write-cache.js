export const setUpRecurringPaymentCache = async (request, recurringPayment) => {
  if (!recurringPayment) return

  const { agreementId, lastDigitsCardNumber, status, cancelledDate, cancelledReason, endDate, nextDueDate } = recurringPayment

  await request.cache().helpers.status.setCurrentPermission({
    recurringPayment: {
      agreementId,
      lastDigitsCardNumber,
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

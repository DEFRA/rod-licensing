export const setupCancelRecurringPaymentCacheFromAuthResult = async (request, authenticationResult) => {
  const { permission, recurringPayment } = authenticationResult
  const { referenceNumber, endDate, licensee, permit } = permission

  await request.cache().helpers.transaction.setCurrentPermission({
    permission: {
      referenceNumber,
      endDate,
      licensee: { name: licensee.name },
      permit: { description: permit.description }
    },
    recurringPayment: {
      lastDigitsCardNumber: recurringPayment.lastDigitsCardNumber
    }
  })
}

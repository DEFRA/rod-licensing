export const setupCancelRecurringPaymentCacheFromAuthResult = async (request, authenticationResult) => {
  const { permission, recurringPayment } = authenticationResult
  const { referenceNumber, endDate, licensee, permit } = permission

  await request.cache().helpers.transaction.setCurrentPermission({
    permission: {
      referenceNumber,
      endDate,
      licensee: { firstName: licensee.firstName, lastName: licensee.lastName },
      permit: { description: permit.description }
    },
    recurringPayment: {
      id: recurringPayment.id,
      lastDigitsCardNumbers: recurringPayment.lastDigitsCardNumbers
    }
  })
}

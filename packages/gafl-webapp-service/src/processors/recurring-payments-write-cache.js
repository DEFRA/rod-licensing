export const setupCancelRecurringPaymentCacheFromAuthResult = async (request, authenticationResult) => {
  const { permission, recurringPayment } = authenticationResult
  const { referenceNumber, endDate, licensee, permit } = permission

  await request.cache().helpers.transaction.setCurrentPermission({
    permission: {
      referenceNumber,
      endDate,
      licensee: {
        firstName: licensee.firstName,
        lastName: licensee.lastName,
        preferredMethodOfConfirmation: licensee.preferredMethodOfConfirmation?.label
      },
      permit: { description: permit.description, permitSubtype: permit.permitSubtype, numberOfRods: permit.numberOfRods, concessions: permit.concessions }
    },
    recurringPayment: {
      id: recurringPayment.id,
      lastDigitsCardNumbers: recurringPayment.lastDigitsCardNumbers
    }
  })
}

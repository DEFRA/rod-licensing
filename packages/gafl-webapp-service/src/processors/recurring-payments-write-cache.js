const normaliseConcessions = concessions =>
  (concessions ?? []).map(concession => ({
    type: concession?.name || concession?.type?.label || concession?.type,
    proof: {
      type: concession?.proof?.type?.label || concession?.proof?.type,
      ...(concession?.proof?.referenceNumber ? { referenceNumber: concession.proof.referenceNumber } : {})
    }
  }))

export const setupCancelRecurringPaymentCacheFromAuthResult = async (request, authenticationResult) => {
  const { permission, recurringPayment } = authenticationResult
  const { referenceNumber, endDate, licensee, permit, concessions } = permission

  await request.cache().helpers.transaction.setCurrentPermission({
    permission: {
      referenceNumber,
      endDate,
      licensee: {
        firstName: licensee.firstName,
        lastName: licensee.lastName,
        preferredMethodOfConfirmation: licensee.preferredMethodOfConfirmation?.label
      },
      permit: {
        description: permit.description,
        permitSubtype: permit.permitSubtype,
        numberOfRods: permit.numberOfRods
      },
      concessions: normaliseConcessions(concessions)
    },
    recurringPayment: {
      id: recurringPayment.id,
      lastDigitsCardNumbers: recurringPayment.lastDigitsCardNumbers
    }
  })
}

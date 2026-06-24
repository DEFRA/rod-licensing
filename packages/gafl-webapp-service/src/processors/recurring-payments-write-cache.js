import { CONCESSION, CONCESSION_PROOF } from './mapping-constants.js'

const concessionsFromPermitDescription = description => {
  const concessions = []
  if (description && description.includes('Senior')) {
    concessions.push({
      type: CONCESSION.SENIOR,
      proof: { type: CONCESSION_PROOF.none }
    })
  }
  return concessions
}

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
      permit: {
        description: permit.description,
        permitSubtype: permit.permitSubtype,
        numberOfRods: permit.numberOfRods
      },
      concessions: concessionsFromPermitDescription(permit.description)
    },
    recurringPayment: {
      id: recurringPayment.id,
      lastDigitsCardNumbers: recurringPayment.lastDigitsCardNumbers
    }
  })
}

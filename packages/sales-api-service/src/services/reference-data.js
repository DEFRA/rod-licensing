import { Permit, Concession, TransactionCurrency, PermitConcession, retrieveMultipleAsMap } from '@defra-fish/dynamics-lib'
let referenceData, optionSets

const fetch = async () => {
  if (!(referenceData || optionSets)) {
    ;[referenceData, optionSets] = await Promise.all([
      retrieveMultipleAsMap(Permit, Concession, PermitConcession, TransactionCurrency)
      // fetchOptionSets()
    ])
  }
  return { referenceData, optionSets }
}

export async function getReferenceData () {
  return (await fetch()).referenceData
}

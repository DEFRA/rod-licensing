import {
  Permit,
  Concession,
  TransactionCurrency,
  PermitConcession,
  retrieveMultipleAsMap,
  retrieveGlobalOptionSets
} from '@defra-fish/dynamics-lib'

export async function getReferenceData () {
  return retrieveMultipleAsMap(Permit, Concession, PermitConcession, TransactionCurrency).cached()
}

export async function getGlobalOptionSets (...names) {
  return retrieveGlobalOptionSets(...names).cached()
}

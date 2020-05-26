export const MAX_BATCH_SIZE = 25

export const FILE_STAGE = {
  Pending: 'Pending',
  Staging: 'Staging Transactions',
  Finalising: 'Finalising Transactions',
  Completed: 'Completed'
}

export const RECORD_STAGE = {
  TransactionCreated: 'Transaction Created',
  TransactionCreationFailed: 'Transaction Creation Failed',
  TransactionFinalised: 'Transaction Finalised',
  TransactionFinalisationFailed: 'Transaction Finalisation Failed'
}

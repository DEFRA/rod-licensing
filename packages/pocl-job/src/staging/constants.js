export const MAX_CREATE_TRANSACTION_BATCH_SIZE = 25
export const MAX_FINALISE_TRANSACTION_BATCH_SIZE = 10

export const POST_OFFICE_DATASOURCE = 'Post Office Sales'
export const DIRECT_DEBIT_DATASOURCE = 'DDE File'
export const DIRECT_DEBIT_PAYMENTSOURCE = 'Direct Debit'
export const POSTAL_ORDER_DATASOURCE = 'Postal Order Sales'
export const POSTAL_ORDER_PAYMENTSOURCE = 'Postal Order'

export const FILE_STAGE = {
  Pending: 'Received and Pending',
  Staging: 'Staging Transactions',
  Finalising: 'Finalising Transactions',
  Completed: 'Completed'
}

export const DYNAMICS_IMPORT_STAGE = {
  Pending: 'Received and Pending',
  InProgress: 'In Progress',
  Processed: 'Processed',
  ProcessedWithWarnings: 'Processed with Warnings',
  Failed: 'Failed',
  UnderReview: 'Under Review',
  Closed: 'Closed',
  isAlreadyProcessed: status => status !== DYNAMICS_IMPORT_STAGE.Pending && status !== DYNAMICS_IMPORT_STAGE.InProgress
}

export const RECORD_STAGE = {
  TransactionCreated: 'Transaction Created',
  TransactionCreationFailed: 'Transaction Creation Failed',
  TransactionFinalised: 'Transaction Finalised',
  TransactionFinalisationFailed: 'Transaction Finalisation Failed'
}

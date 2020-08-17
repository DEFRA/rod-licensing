import ReferenceData from './reference-data.js'
import OptionSets from './option-sets.js'
import Transactions from './transactions.js'
import TransactionFiles from './transaction-files.js'
import PaymentJournals from './payment-journals.js'
import StagingExceptions from './staging-exceptions.js'
import Authenticate from './authenticate.js'
import Users from './system-users.js'

import Static from './static.js'

export default [
  ...Static,
  ...ReferenceData,
  ...OptionSets,
  ...Transactions,
  ...TransactionFiles,
  ...PaymentJournals,
  ...StagingExceptions,
  ...Authenticate,
  ...Users
]

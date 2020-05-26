import ReferenceData from './reference-data.js'
import OptionSets from './option-sets.js'
import Transactions from './transactions.js'
import TransactionFiles from './transaction-files.js'

import Static from './static.js'

export default [...Static, ...ReferenceData, ...OptionSets, ...Transactions, ...TransactionFiles]

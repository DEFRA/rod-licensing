import { retrieveRecurringPaymentStagedTransactions } from "../retrieve-transaction.js"
import { 
  TRANSACTION_STAGING_TABLE, 
  TRANSACTION_STAGING_HISTORY_TABLE, 
  TRANSACTION_DATA_SOURCE_INDEX,
  DATA_SOURCE_COLUMN_NAME,
  RECURRING_PAYMENTS_DATA_SOURCE
} from '../../../config.js'
import { TRANSACTION_STATUS } from '../constants.js'
import { AWS } from '@defra-fish/connectors-lib'

jest.mock('@defra-fish/connectors-lib', () => ({
  AWS: jest.fn(() => ({
    docClient: {
      queryAllPromise: jest.fn(() => [ getSampleTransaction() ])
    }
  }))
}))
jest.mock('../../../config.js', () => ({
  TRANSACTION_STAGING_TABLE: { TableName: 'transactionstagingtable', Ttl: 0, StagingErrorsTtl: 0},
  TRANSACTION_STAGING_HISTORY_TABLE: { TableName: 'transactionstaginghistorytable', Ttl: 0, StagingErrorsTtl: 0},
  TRANSACTION_DATA_SOURCE_INDEX: 'transaction-data-source-index',
  DATA_SOURCE_COLUMN_NAME: 'data-source-column-name',
  RECURRING_PAYMENTS_DATA_SOURCE: 'recurring-payments-data-source'
}))
jest.mock('../constants.js', () => ({
  TRANSACTION_STATUS: {
    STAGED: 'staged-status',
    FINALISED: 'finalised-status'
  }
}))
const [{ value: { docClient } }] = AWS.mock.results

const getSampleTransaction = () => ({
  status: { id: 'STAGED' }
})

describe('retrieve staged recurring payment transactions', () => {
  beforeEach(jest.clearAllMocks)

  it('gets recurring payment transactions from transaction staging table', async () => {
    const mockStagedTransactions = [ getSampleTransaction(), getSampleTransaction(), getSampleTransaction() ]
    docClient.queryAllPromise.mockReturnValueOnce(mockStagedTransactions)
    const rpStagedTransactions = await retrieveRecurringPaymentStagedTransactions()
    expect(rpStagedTransactions).toEqual(mockStagedTransactions)
  })

  it('passes expected arguments to queryAllPromise', async () => {
    await retrieveRecurringPaymentStagedTransactions()
    expect(docClient.queryAllPromise).toHaveBeenCalledWith({
      TableName: TRANSACTION_STAGING_TABLE,
      IndexName: TRANSACTION_DATA_SOURCE_INDEX,
      KeyConditionExpression: `${DATA_SOURCE_COLUMN_NAME} = :dataSourceVal`, //'dataSource = :val',
      FilterExpression: '#status.#id = :statusIdVal',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#id': 'id',
      },
      ExpressionAttributeValues: {
          ':dataSourceVal': RECURRING_PAYMENTS_DATA_SOURCE,
          ':statusIdVal': TRANSACTION_STATUS.STAGED
      }
    })
  })
})

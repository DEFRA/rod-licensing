import updateTransaction from '../update-transaction'
import { COMPLETION_STATUS } from '../../../../constants.js'
import db from 'debug'

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:set-agreed')]
const getSampleRequest = (statusSet = () => {}) => ({
  cache: () => ({
    helpers: {
      status: {
        set: statusSet
      }
    }
  })
})

beforeEach(jest.clearAllMocks)

describe('update transaction', () => {
  it('should set status to agreed', async () => {
    const statusSet = jest.fn()
    await updateTransaction(getSampleRequest(statusSet))

    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.agreed]: true
      })
    )
  })

  it('debug should be called setting the status to agreed', async () => {
    await updateTransaction(getSampleRequest())

    expect(debug).toHaveBeenCalledWith('Setting status to agreed')
  })
})

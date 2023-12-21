import updateTransaction from '../update-transaction'
import { COMPLETION_STATUS } from '../../../../constants.js'
import db from 'debug'

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:set-agreed')]
const getSampleRequest = (statusSet = () => {}, pagePermission = {}) => ({
  cache: () => ({
    helpers: {
      status: {
        set: statusSet
      },
      page: {
        getCurrentPermission: () => pagePermission
      }
    }
  })
})

beforeEach(jest.clearAllMocks)

describe('update transaction', () => {
  it('should set status to agreed if not a recurring payment', async () => {
    const statusSet = jest.fn()
    const pagePermission = { payload: { 'recurring-payment': 'no' } }
    await updateTransaction(getSampleRequest(statusSet, pagePermission))

    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.agreed]: true
      })
    )
  })

  it('debug should be called setting the status to agreed if not a recurring payment', async () => {
    const pagePermission = { payload: { 'recurring-payment': 'no' } }
    await updateTransaction(getSampleRequest(jest.fn(), pagePermission))

    expect(debug).toHaveBeenCalledWith('Setting status to agreed')
  })

  it('should not set status to agreed if a recurring payment', async () => {
    const statusSet = jest.fn()
    const pagePermission = { payload: { 'recurring-payment': 'yes' } }
    await updateTransaction(getSampleRequest(statusSet, pagePermission))

    expect(statusSet).not.toHaveBeenCalled()
  })

  it('debug should not be called when is a recurring payment', async () => {
    const pagePermission = { payload: { 'recurring-payment': 'yes' } }
    await updateTransaction(getSampleRequest(jest.fn(), pagePermission))

    expect(debug).not.toHaveBeenCalled()
  })
})

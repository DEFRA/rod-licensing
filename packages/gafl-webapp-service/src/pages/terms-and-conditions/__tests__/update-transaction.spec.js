import updateTransaction from '../update-transaction'
import { COMPLETION_STATUS } from '../../../constants.js'
import { validForRecurringPayment } from '../../../processors/recurring-pay-helper.js'
import db from 'debug'

jest.mock('../../../processors/recurring-pay-helper.js')

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:set-agreed')]
const getSampleRequest = ({ statusSet = () => {}, permission }) => ({
  cache: () => ({
    helpers: {
      status: {
        set: statusSet
      },
      transaction: {
        getCurrentPermission: () => permission
      }
    }
  })
})

beforeEach(jest.clearAllMocks)

describe('update transaction', () => {
  it('should set status to agreed', async () => {
    const statusSet = jest.fn()
    await updateTransaction(getSampleRequest({ statusSet }))

    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.agreed]: true
      })
    )
  })

  it('validForRecurringPayment is called with a permission', async () => {
    const permission = Symbol('permission')

    await updateTransaction(getSampleRequest({ permission }))

    expect(validForRecurringPayment).toHaveBeenCalledWith(permission)
  })

  it('should set status to agreed when validForRecurringPayment is false', async () => {
    const statusSet = jest.fn()
    validForRecurringPayment.mockReturnValueOnce(false)
    await updateTransaction(getSampleRequest({ statusSet }))

    expect(statusSet).toHaveBeenCalled()
  })

  it('should not set status to agreed when validForRecurringPayment is true', async () => {
    const statusSet = jest.fn()
    validForRecurringPayment.mockReturnValueOnce(true)
    await updateTransaction(getSampleRequest({ statusSet }))

    expect(statusSet).not.toHaveBeenCalled()
  })

  it('debug should be called setting the status to agreed when when validForRecurringPayment is false', async () => {
    validForRecurringPayment.mockReturnValueOnce(false)
    await updateTransaction(getSampleRequest({}))

    expect(debug).toHaveBeenCalledWith('Setting status to agreed')
  })

  it('debug should be called saying "Recurring payment valid option" when validForRecurringPayment is true', async () => {
    validForRecurringPayment.mockReturnValueOnce(true)
    await updateTransaction(getSampleRequest({}))

    expect(debug).toHaveBeenCalledWith('Recurring payment valid option')
  })
})

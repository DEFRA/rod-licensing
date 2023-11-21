import updateTransaction from '../update-transaction'
import { COMPLETION_STATUS } from '../../../constants.js'
import db from 'debug'

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
    process.env.SHOW_RECURRING_PAYMENTS = 'false'
    await updateTransaction(getSampleRequest({ statusSet }))

    expect(statusSet).toHaveBeenCalledWith(
      expect.objectContaining({
        [COMPLETION_STATUS.agreed]: true
      })
    )
  })

  it('debug should be called setting the status to agreed', async () => {
    process.env.SHOW_RECURRING_PAYMENTS = 'true'
    const permission = {
      licenceLength: '8D'
    }
    await updateTransaction(getSampleRequest({ permission }))

    expect(debug).toHaveBeenCalledWith('Setting status to agreed')
  })

  it('debug should be called saying "Recurring payment valid option" when SHOW_RECURRING_PAYMENTS is true and licence length is 12M', async () => {
    process.env.SHOW_RECURRING_PAYMENTS = 'true'
    const permission = {
      licenceLength: '12M'
    }
    await updateTransaction(getSampleRequest({ permission }))

    expect(debug).toHaveBeenCalledWith(('Recurring payment valid option'))
  })
})

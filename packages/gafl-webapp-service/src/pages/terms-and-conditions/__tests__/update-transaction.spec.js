import updateTransaction from '../update-transaction.js'
import db from 'debug'
import { COMPLETION_STATUS } from '../../../constants.js'

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:set-agreed')]

describe('terms-and-conditions > update-transaction', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const mockStatusSet = jest.fn()

  const getMockRequest = () => ({
    cache: () => ({
      helpers: {
        status: {
          set: mockStatusSet
        }
      }
    })
  })

  describe('default', () => {
    it('debug is called with correct message', async () => {
      await updateTransaction(getMockRequest())
      expect(debug).toHaveBeenCalledWith('Setting status to agreed')
    })

    it('COMPLETION_STATUS is set to true', async () => {
      await updateTransaction(getMockRequest())
      expect(mockStatusSet).toHaveBeenCalledWith(expect.objectContaining({ [COMPLETION_STATUS.agreed]: true }))
    })
  })
})

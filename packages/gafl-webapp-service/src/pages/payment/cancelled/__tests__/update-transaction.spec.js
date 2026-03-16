import updateTransaction from '../update-transaction.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

describe('payment cancelled update-transaction', () => {
  it.each([
    [
      'resets paymentCreated and paymentCancelled flags to enable retry',
      {
        [COMPLETION_STATUS.paymentCreated]: true,
        [COMPLETION_STATUS.paymentCancelled]: true,
        [COMPLETION_STATUS.agreed]: true,
        otherFlag: true
      },
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentCancelled]: false,
        [COMPLETION_STATUS.agreed]: true,
        otherFlag: true
      }
    ],
    [
      'works when flags are already false',
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentCancelled]: false
      },
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentCancelled]: false
      }
    ]
  ])('%s', async (description, initialStatus, expectedStatus) => {
    const mockSet = jest.fn()
    const mockGet = jest.fn().mockResolvedValue(initialStatus)

    const request = {
      cache: () => ({
        helpers: {
          status: {
            get: mockGet,
            set: mockSet
          }
        }
      })
    }

    await updateTransaction(request)

    expect(mockGet).toHaveBeenCalledTimes(1)
    expect(mockSet).toHaveBeenCalledWith(expectedStatus)
  })
})

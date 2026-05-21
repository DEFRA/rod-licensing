import updateTransaction from '../update-transaction.js'
import { COMPLETION_STATUS } from '../../../../constants.js'

describe('payment failed update-transaction', () => {
  const testScenarios = [
    [
      'resets paymentCreated and paymentFailed flags to enable retry',
      {
        [COMPLETION_STATUS.paymentCreated]: true,
        [COMPLETION_STATUS.paymentFailed]: true,
        [COMPLETION_STATUS.agreed]: true,
        otherFlag: true
      },
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentFailed]: false,
        [COMPLETION_STATUS.agreed]: true,
        otherFlag: true
      }
    ],
    [
      'works when flags are already false',
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentFailed]: false
      },
      {
        [COMPLETION_STATUS.paymentCreated]: false,
        [COMPLETION_STATUS.paymentFailed]: false
      }
    ]
  ]

  const executeUpdateTransaction = async initialStatus => {
    const mockSet = jest.fn()
    const mockGet = jest.fn().mockResolvedValueOnce(initialStatus)

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
    return { mockGet, mockSet }
  }

  it.each(testScenarios)('%s - calls get once', async (description, initialStatus) => {
    const { mockGet } = await executeUpdateTransaction(initialStatus)
    expect(mockGet).toHaveBeenCalledTimes(1)
  })

  it.each(testScenarios)('%s - sets correct status', async (description, initialStatus, expectedStatus) => {
    const { mockSet } = await executeUpdateTransaction(initialStatus)
    expect(mockSet).toHaveBeenCalledWith(expectedStatus)
  })
})

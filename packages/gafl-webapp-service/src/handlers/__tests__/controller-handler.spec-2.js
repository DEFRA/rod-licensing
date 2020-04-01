import controllerHandler from '../controller-handler.js'

/**
 * Standalone tests on the controller
 */

jest.mock('../update-transaction-functions.js', () => {
  return {
    test: jest.fn(() => {
      throw new Error('Random exception')
    }),
    TransactionError: class TransactionError extends Error {}
  }
})

describe('The controller function', () => {
  it('The controller re-throws any exceptions which are not transaction errors ', async () => {
    const request = {
      cache: () => ({
        helpers: { status: { getCurrentPermission: () => ({ currentPage: 'test' }) } }
      })
    }
    try {
      await controllerHandler(request)
    } catch (err) {
      expect(err.message).toBe('Random exception')
    }
  })
})

import controllerHandler from '../controller-handler.js'

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

    await expect(async () => controllerHandler(request)).rejects
  })
})

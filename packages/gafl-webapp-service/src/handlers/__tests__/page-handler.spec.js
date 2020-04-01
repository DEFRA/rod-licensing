import pageHandler from '../page-handler.js'

describe('The page handler function', () => {
  it('re-throws any exceptions which are not transaction errors ', async () => {
    const request = {
      cache: () => ({
        helpers: {
          page: {
            setCurrentPermission: () => {
              throw new Error('Random exception')
            }
          }
        }
      })
    }
    try {
      await pageHandler().error(request, null, { details: [] })
    } catch (err) {
      expect(err.message).toBe('Random exception')
    }
  })
})

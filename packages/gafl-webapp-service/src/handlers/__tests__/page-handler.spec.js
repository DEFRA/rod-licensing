import pageHandler from '../page-handler.js'

describe('The page handler function', () => {
  it('the get method re-throws any exceptions which are not transaction errors ', async () => {
    const request = {
      cache: () => ({
        helpers: {
          page: {
            getCurrentPermission: () => ({})
          }
        }
      })
    }

    const getData = async () => {
      throw new Error('Random exception')
    }

    try {
      await pageHandler(null, null, null, getData).get(request)
    } catch (err) {
      expect(err.message).toBe('Random exception')
    }
  })

  it('the error method re-throws any exceptions which are not transaction errors ', async () => {
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

import db from 'debug'
import pageHandler from '../page-handler.js'

jest.mock('debug', () => jest.fn(() => jest.fn()))

describe('The page handler function', () => {
  let fakeDebug

  beforeAll(() => {
    fakeDebug = db.mock.results[0].value
  })
  beforeEach(jest.clearAllMocks)

  it('the get method re-throws any exceptions which are not transaction errors ', async () => {
    const request = {
      cache: () => ({
        helpers: {
          page: {
            getCurrentPermission: () => ({})
          },
          status: {
            getCurrentPermission: () => ({}),
            setCurrentPermission: () => {}
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
          },
          status: {
            getCurrentPermission: () => ({}),
            setCurrentPermission: () => {}
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

  it('logs the cache if getCurrentPermission throws an error', async () => {
    const request = {
      cache: () => ({
        helpers: {
          page: {
            getCurrentPermission: () => {
              throw new Error('Random exception')
            },
            get: () => ({})
          },
          status: {
            get: () => ({})
          },
          transaction: {
            get: () => ({})
          }
        }
      })
    }
    await expect(pageHandler().get(request)).rejects.toThrow('Random exception')
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Page cache'))
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Status cache'))
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Transaction cache'))
  })
})

import db from 'debug'
import pageHandler from '../page-handler.js'
import journeyDefinition from '../../routes/journey-definition.js'

jest.mock('debug', () => jest.fn(() => jest.fn()))
jest.mock('../../routes/journey-definition.js', () => [])

describe('The page handler function', () => {
  let fakeDebug

  beforeAll(() => {
    fakeDebug = db.mock.results[0].value
  })
  beforeEach(() => {
    jest.clearAllMocks()
    journeyDefinition.length = 0
  })

  it('the get method re-throws any exceptions which are not transaction errors ', async () => {
    const request = getMockRequest()

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
    const request = getMockRequest(() => {
      throw new Error('Random exception')
    })
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

  it.each([
    ['?lang=cy', '\\?lang=cy'],
    ['?other-info=abc123&lang=cy', '\\?lang=cy'],
    ['?extra-info=123&extra-rods=2&lang=cy&cold-beer=yes-please', '\\?lang=cy'],
    ['', ''],
    ['?other-info=bbb-111', ''],
    ['?misc-data=999&extra-rods=1&marmite=no-thanks', '']
  ])('persists the lang code when reloading the page in the event of an error', async (search, expected) => {
    console.log('expected', typeof expected)
    const { error } = pageHandler('', 'view')
    const mockToolkit = {
      redirect: jest.fn(() => ({ takeover: () => {} }))
    }
    const mockRequest = {
      ...getMockRequest(),
      path: '/current/page',
      url: {
        search
      }
    }
    await error(mockRequest, mockToolkit, { details: [] })
    expect(mockToolkit.redirect).toHaveBeenCalledWith(expect.stringMatching(new RegExp(`/current/page${expected}`)))
  })
})

const getMockRequest = (setCurrentPermission = () => {}) => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: () => ({}),
        setCurrentPermission
      },
      status: {
        getCurrentPermission: () => ({}),
        setCurrentPermission: () => {}
      }
    }
  }),
  path: '/we/are/here',
  url: {
    search: ''
  }
})

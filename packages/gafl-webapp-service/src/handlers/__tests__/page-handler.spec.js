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
    const request = getSampleRequest()

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
    const request = getSampleRequest({
      setCurrentPermission: () => {
        throw new Error('Random exception')
      }
    })
    try {
      await pageHandler().error(request, null, { details: [] })
    } catch (err) {
      expect(err.message).toBe('Random exception')
    }
  })

  it('logs the cache if getCurrentPermission throws an error', async () => {
    const request = getSampleRequest({
      getCurrentPermission: () => {
        throw new Error('Random exception')
      }
    })
    await expect(pageHandler().get(request)).rejects.toThrow('Random exception')
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Page cache'))
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Status cache'))
    expect(fakeDebug).toHaveBeenCalledWith(expect.stringContaining('Transaction cache'))
  })

  it('post redirects to a Welsh page if the current page is in Welsh', async () => {
    const { post } = pageHandler(null, 'view', '/next/page')
    const request = getSampleRequest({}, 'https://sampleurl.gov.uk/current/page?lang=cy')
    const toolkit = getSampleToolkit()
    await post(request, toolkit)
    expect(toolkit.redirect).toHaveBeenCalledWith(
      expect.stringMatching(/\/next\/page\?lang=cy/)
    )
  })

  it('post redirects to an English page if the current page is in English', async () => {
    const { post } = pageHandler(null, 'view', '/next/page')
    const request = getSampleRequest()
    const toolkit = getSampleToolkit()
    await post(request, toolkit)
    expect(toolkit.redirect).toHaveBeenCalledWith(
      expect.stringMatching('/next/page')
    )
  })

  it('redirects to an English page if request.info.referrer isn\'t available', async () => {
    const { post } = pageHandler(null, 'view', '/next/page')
    const request = getSampleRequest()
    delete request.info
    const toolkit = getSampleToolkit()
    await post(request, toolkit)
    expect(toolkit.redirect).toHaveBeenCalledWith(
      expect.stringMatching('/next/page')
    )
  })
})

const getSampleRequest = (pageHelpers = {}, referrer = 'https://sampleurl.gov.uk/current/page') => ({
  cache: () => ({
    helpers: {
      page: {
        getCurrentPermission: () => ({}),
        get: () => ({}),
        setCurrentPermission: () => {},
        ...pageHelpers
      },
      status: {
        getCurrentPermission: () => ({}),
        setCurrentPermission: () => {},
        get: () => ({})
      },
      transaction: {
        get: () => ({})
      }
    }
  }),
  info: {
    referrer
  }
})

const getSampleToolkit = () => ({
  redirect: jest.fn()
})

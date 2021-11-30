import pageRoute from '../../../../routes/page-route.js'
import { nextPage } from '../../../../routes/next-page.js'
import { initialiseSession } from '../../../../handlers/new-session-handler.js'

const mockPostHandler = jest.fn()
jest.mock('../../../../routes/next-page.js', () => ({
  nextPage: jest.fn()
}))
jest.mock('../../../../routes/page-route.js', () => jest.fn(() => [
  {
    method: 'GET',
    handler: () => {}
  },
  {
    method: 'POST',
    handler: mockPostHandler
  }
]))
jest.mock('../../../../handlers/new-session-handler.js')
const { default: licenceForRoute, validator } = require('../route.js')

describe('licence-for > route', () => {
  describe('validator', () => {
    it('should return an error, if licence-for is not you or someone-else', () => {
      const result = validator.validate({ 'licence-for': 'none' })
      expect(result.error).not.toBeUndefined()
      expect(result.error.details[0].message).toBe('"licence-for" must be one of [you, someone-else]')
    })

    it('should not return an error, if licence-for is you', () => {
      const result = validator.validate({ 'licence-for': 'you' })
      expect(result.error).toBeUndefined()
    })

    it('should not return an error, if licence-for is someone-else', () => {
      const result = validator.validate({ 'licence-for': 'someone-else' })
      expect(result.error).toBeUndefined()
    })
  })

  describe('default', () => {
    it('should call the pageRoute with licence-for, /buy/licence-for, validator and nextPage', async () => {
      expect(pageRoute).toBeCalledWith('licence-for', '/buy/licence-for', validator, nextPage)
    })
  })

  describe('POST handler', () => {
    const postHandler = licenceForRoute.find(r => r.method === 'POST').handler
    beforeEach(jest.clearAllMocks)

    it('should call default POST handler', async () => {
      await postHandler(getMockRequest(), {})
      expect(mockPostHandler).toHaveBeenCalled()
    })

    it('should call default POST handler with request and response toolkit', async () => {
      const mockRequest = getMockRequest()
      const mockResponseToolkit = {}
      await postHandler(mockRequest, mockResponseToolkit)
      expect(mockPostHandler).toHaveBeenCalledWith(mockRequest, mockResponseToolkit)
    })

    it('should return value of default POST handler', async () => {
      const retVal = Symbol('Prince')
      mockPostHandler.mockReturnValue(retVal)
      expect(await postHandler(getMockRequest(), {})).toBe(retVal)
    })

    it.each([
      ['you', 'someone-else'],
      ['someone-else', 'you']
    ])('should call new session handler if licence for has changed from %s to %s', async (licenceForInPayload, licenceForInCache) => {
      const mockRequest = getMockRequest(licenceForInPayload, licenceForInCache)
      const mockResponseToolkit = {}
      await postHandler(mockRequest, mockResponseToolkit)
      expect(initialiseSession).toHaveBeenCalledWith(mockRequest)
    })

    it.each([
      ['you', 'you'],
      ['someone-else', 'someone-else']
    ])('should omit call to new session handler if licence for hasn\'t changed', async (licenceForInPayload, licenceForInCache) => {
      const mockRequest = getMockRequest(licenceForInPayload, licenceForInCache)

      const mockResponseToolkit = {}
      await postHandler(mockRequest, mockResponseToolkit)
      expect(initialiseSession).not.toHaveBeenCalled()
    })
  })

  const getMockRequest = (licenceForInPayload = 'you', licenceForInCache = 'someone-else') => ({
    payload: {
      'licence-for': licenceForInPayload
    },
    cache: () => ({
      helpers: {
        page: {
          getCurrentPermission: async () => ({
            'licence-for': {
              payload: {
                'licence-for': licenceForInCache
              }
            }
          })
        }
      }
    })
  })
})

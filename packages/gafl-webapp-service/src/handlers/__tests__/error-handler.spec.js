import { errorHandler } from '../error-handler.js'
import { CLIENT_ERROR } from '../../uri.js'

const mockView = jest.fn(() => ({
  code: jest.fn()
}))
const h = {
  view: mockView
}

describe('error-handler', () => {
  describe('errorHandler', () => {
    it('should pass the referer to the view if it is present', async () => {
      const request = {
        headers: {
          referer: 'http://example.com'
        },
        response: {
          isBoom: true,
          output: {
            statusCode: 400
          }
        }
      }
      await errorHandler(request, h)
      expect(mockView).toBeCalledWith(
        CLIENT_ERROR.page,
        expect.objectContaining({
          referer: 'http://example.com'
        })
      )
    })

    it('should not pass the referer to the view if it is not present', async () => {
      const request = {
        headers: {},
        response: {
          isBoom: true,
          output: {
            statusCode: 400
          }
        }
      }
      await errorHandler(request, h)
      expect(mockView).toBeCalledWith(
        CLIENT_ERROR.page,
        expect.not.objectContaining({
          referer: 'http://example.com'
        })
      )
    })
  })
})

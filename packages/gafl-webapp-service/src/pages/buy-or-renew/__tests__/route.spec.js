const mockPostHandler = jest.fn()
const mockNextPage = jest.fn()
jest.mock('../../../routes/next-page.js', () => ({
  nextPage: mockNextPage
}))
jest.mock('../../handlers/new-session-handler.js')

describe('licence-for > route', () => {
  describe('main tests', () => {
    jest.isolateModules(() => {
      const mockPageRoute = jest.fn(() => [
        {
          method: 'GET',
          handler: () => {}
        },
        {
          method: 'POST',
          handler: mockPostHandler
        }
      ])
      jest.mock('../../../routes/page-route.js', () => mockPageRoute)
      const { default: validator } = require('../route.js')

      describe('validator', () => {
        it('should return an error, if buy-or-renew is not buy-licence or renew-licence', () => {
          const result = validator.validate({ 'buy-or-renew': 'none' })
          expect(result.error).not.toBeUndefined()
          expect(result.error.details[0].message).toBe('"buy-or-renew" must be one of [buy-licence, renew-licence]')
        })

        it('should not return an error, if buy-or-renew is buy-licence', () => {
          const result = validator.validate({ 'buy-or-renew': 'buy-licence' })
          expect(result.error).toBeUndefined()
        })

        it('should not return an error, if buy-or-renew is renew-licence', () => {
          const result = validator.validate({ 'buy-or-renew': 'renew-licence' })
          expect(result.error).toBeUndefined()
        })
      })
    })
  })
})

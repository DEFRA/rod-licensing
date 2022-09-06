import { setupEnvironment } from '../../__mocks__/openid-client.js'
import { CLIENT_ERROR } from '../../uri.js'
import errorRoutes from '../error-routes'

let TestUtils = null

describe('Error route handlers', () => {
  beforeAll(async () => {
    jest.isolateModules(() => {
      process.env.ERROR_PAGE_ROUTE = 'true'
      setupEnvironment()
      TestUtils = require('../../__mocks__/test-utils-system.js')
      TestUtils.start(() => {})
    })
  })
  beforeEach(jest.clearAllMocks)

  // Stop application after running the test case
  afterAll(async () => {
    TestUtils.stop(() => {})
  })

  it('redirects to the client error page when client error is thrown', async () => {
    const data = await TestUtils.server.inject({
      method: 'GET',
      url: '/buy/client-error'
    })
    expect(data.statusCode).toBe(302)
  })

  describe('CLIENT_ERROR route', () => {
    it('should pass the catalog and language to the view if it is present', async () => {
      const request = getMockRequest()
      const mockToolkit = getMockToolkit()
      const clientError = errorRoutes[0].handler
      await clientError(request, mockToolkit)
      expect(mockToolkit.view).toBeCalledWith(
        CLIENT_ERROR.page,
        expect.objectContaining({
          mssgs: [],
          altLang: []
        })
      )
    })

    describe.each([
      [true, { payment_id: 'abc123', href: 'gov.pay.url' }],
      [true, { payment_id: 'def456', href: 'gov-pay-url' }],
      [false, {}]
    ])('includes correct data when paymentInProgress is %p', (paymentInProgress, payment) => {
      it(`includes paymentInProgress flag with value set to ${paymentInProgress} to correspond to presence of payment_id ${payment.payment_id}`, async () => {
        const request = getMockRequest(payment)
        const mockToolkit = getMockToolkit()
        const clientError = errorRoutes[0].handler
        await clientError(request, mockToolkit)
        expect(mockToolkit.view).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            paymentInProgress
          })
        )
      })

      it(`${paymentInProgress ? 'includes' : 'excludes'} govpay url`, async () => {
        const request = getMockRequest(payment)
        const mockToolkit = getMockToolkit()
        const clientError = errorRoutes[0].handler
        await clientError(request, mockToolkit)
        if (paymentInProgress) {
          expect(mockToolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              uri: expect.objectContaining({
                payment: payment.href
              })
            })
          )
        } else {
          expect(mockToolkit.view).not.toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              uri: expect.objectContaining({
                payment: payment.href
              })
            })
          )
        }
      })
    })
  })
})

const getMockToolkit = (view = jest.fn(() => ({ code: () => {} }))) => ({
  view
})

const getMockRequest = (payment = {}) => ({
  cache: () => ({
    helpers: {
      transaction: {
        get: () =>
          Promise.resolve({
            payment
          })
      }
    }
  }),
  headers: {},
  i18n: {
    getCatalog: () => [],
    getLocales: () => []
  },
  response: {
    isBoom: true,
    output: {
      statusCode: 400
    }
  },
  url: 'url',
  path: 'path',
  query: 'query',
  params: 'params',
  payload: 'payload',
  state: 'state',
  method: 'method'
})

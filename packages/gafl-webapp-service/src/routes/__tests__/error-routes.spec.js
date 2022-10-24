import errorRoutes from '../error-routes'
import { CLIENT_ERROR, NEW_TRANSACTION } from '../../uri.js'

describe('Error route handlers', () => {
  describe('CLIENT_ERROR route', () => {
    it('has a return value with a method of GET and path of /buy/client-error', async () => {
      expect(errorRoutes).toMatchSnapshot()
    })

    describe('handler', () => {
      const clientError = errorRoutes[0].handler

      it('handler should return correct values', async () => {
        const mockToolkit = getMockToolkit()
        await clientError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toMatchSnapshot()
      })

      it('second argument of handler return correct values', async () => {
        const href = Symbol('gov.pay.url')
        const payment = { payment_id: 'abc123', href: href }
        const mockToolkit = getMockToolkit()
        await clientError(getMockRequest(payment), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(CLIENT_ERROR.page, {
          paymentInProgress: true,
          clientError: 'payload',
          mssgs: [],
          altLang: [],
          uri: {
            new: NEW_TRANSACTION.uri,
            payment: href
          }
        })
      })

      it('should pass the catalog and language to the view if it is present', async () => {
        const mockToolkit = getMockToolkit()
        await clientError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(
          CLIENT_ERROR.page,
          expect.objectContaining({
            mssgs: [],
            altLang: []
          })
        )
      })

      it('should respond with the output of the client error to the view if it is present', async () => {
        const mockToolkit = getMockToolkit()
        await clientError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(
          CLIENT_ERROR.page,
          expect.objectContaining({
            clientError: 'payload'
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
      statusCode: 400,
      payload: 'payload'
    }
  }
})

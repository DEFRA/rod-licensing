import errorRoutes from '../error-routes'
import { CLIENT_ERROR, NEW_TRANSACTION, SERVER_ERROR, AGREED } from '../../uri.js'

describe('Error route handlers', () => {
  describe('error route', () => {
    it('has a return value with a method of GET and path of /buy/client-error and /buy/server-error', async () => {
      expect(errorRoutes).toMatchSnapshot()
    })

    describe('CLIENT_ERROR handler', () => {
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

    describe('SERVER_ERROR handler', () => {
      const serverError = errorRoutes[1].handler

      it('handler should return correct values', async () => {
        const mockToolkit = getMockToolkit()
        await serverError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toMatchSnapshot()
      })

      it('second argument of handler return correct values', async () => {
        const mockToolkit = getMockToolkit()
        await serverError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(SERVER_ERROR.page, {
          serverError: 'payload',
          mssgs: [],
          altLang: [],
          uri: {
            new: NEW_TRANSACTION.uri,
            agreed: AGREED.uri
          }
        })
      })

      it('should pass the catalog and language to the view if it is present', async () => {
        const mockToolkit = getMockToolkit()
        await serverError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(
          SERVER_ERROR.page,
          expect.objectContaining({
            mssgs: [],
            altLang: []
          })
        )
      })

      it('should respond with the output of the server error to the view if it is present', async () => {
        const mockToolkit = getMockToolkit()
        await serverError(getMockRequest(), mockToolkit)
        expect(mockToolkit.view).toBeCalledWith(
          SERVER_ERROR.page,
          expect.objectContaining({
            serverError: 'payload'
          })
        )
      })

      it('should log the server error', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(jest.fn())
        const mockToolkit = getMockToolkit()
        const request = getMockRequest()
        await serverError(request, mockToolkit)
        expect(consoleErrorSpy).toHaveBeenCalled()
      })
    })

    describe('altLang', () => {
      describe.each([
        ['client error', 0],
        ['server error', 1]
      ])('when the error is a %s', (_desc, error) => {
        it.each([
          [['kl', 'vu'], 'kl', 'vu'],
          [['si', 'we'], 'we', 'si']
        ])('sets altLang to be other item in two-item language array', async (locales, locale, altLang) => {
          const errorRoute = errorRoutes[error].handler
          const request = getMockRequest({}, { locales, locale })
          const toolkit = getMockToolkit()
          await errorRoute(request, toolkit)
          expect(toolkit.view).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
              altLang: [altLang]
            })
          )
        })
      })
    })
  })

  const getMockToolkit = (view = jest.fn(() => ({ code: () => {} }))) => ({
    view
  })
})

const getMockRequest = (payment = {}, i18nValues = { locales: [], locale: '' }) => ({
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
  url: {},
  path: {},
  query: {},
  params: {},
  payload: 'payload',
  headers: {},
  state: {},
  method: {},
  i18n: {
    getCatalog: () => [],
    getLocales: () => i18nValues.locales,
    getLocale: () => i18nValues.locale
  },
  response: {
    isBoom: true,
    output: {
      statusCode: 400,
      payload: 'payload'
    }
  }
})

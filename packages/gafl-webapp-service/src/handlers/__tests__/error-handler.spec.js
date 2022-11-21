import { errorHandler } from '../error-handler.js'
import { CLIENT_ERROR, NEW_TRANSACTION, CONTROLLER, AGREED } from '../../uri.js'
import { addLanguageCodeToUri } from '../../processors/uri-helper.js'

jest.mock('../../processors/uri-helper.js')

describe('error-handler', () => {
  describe('errorHandler', () => {
    beforeEach(jest.clearAllMocks)
    it('should pass the referer to the view if it is present', async () => {
      const request = {
        ...getMockRequest(),
        headers: {
          referer: 'http://example.com'
        }
      }
      const mockToolkit = getMockToolkit()
      await errorHandler(request, mockToolkit)
      expect(mockToolkit.view).toBeCalledWith(
        CLIENT_ERROR.page,
        expect.objectContaining({
          referer: 'http://example.com'
        })
      )
    })

    it('should not pass the referer to the view if it is not present', async () => {
      const request = getMockRequest()
      const mockToolkit = getMockToolkit()
      await errorHandler(request, mockToolkit)
      expect(mockToolkit.view).toBeCalledWith(
        CLIENT_ERROR.page,
        expect.not.objectContaining({
          referer: 'http://example.com'
        })
      )
    })

    it('should pass the catalog and language to the view if it is present', async () => {
      const request = getMockRequest()
      const mockToolkit = getMockToolkit()
      await errorHandler(request, mockToolkit)
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
        await errorHandler(request, mockToolkit)
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
        await errorHandler(request, mockToolkit)
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

    it.each([[NEW_TRANSACTION.uri], [CONTROLLER.uri], [AGREED.uri]])('called with expected arguments', async urlToCheck => {
      const request = getMockRequest()
      const mockToolkit = getMockToolkit()
      await errorHandler(request, mockToolkit)
      expect(addLanguageCodeToUri).toHaveBeenCalledWith(request, urlToCheck)
    })

    it('uri object returns correct', async () => {
      const decoratedUri = Symbol('uri')
      addLanguageCodeToUri.mockReturnValue(decoratedUri)
      const request = getMockRequest()
      const mockToolkit = getMockToolkit()
      await errorHandler(request, mockToolkit)
      expect(mockToolkit.view).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          uri: expect.objectContaining({
            new: decoratedUri,
            controller: decoratedUri,
            agreed: decoratedUri
          })
        })
      )
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
    url: {
      search: ''
    }
  })
})

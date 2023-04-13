import { AGREED, CLIENT_ERROR, CONTROLLER, NEW_TRANSACTION, SERVER_ERROR } from '../uri.js'
import { addLanguageCodeToUri } from '../processors/uri-helper.js'

/**
 * Pre-response error handler server extension.
 * Display either the client or server error page and make error payload available to the template
 * @param request
 * @param h
 * @returns {Promise<symbol|string|((key?: IDBValidKey) => void)|*>}
 */
export const errorHandler = async (request, h) => {
  if (!request.response.isBoom) {
    return h.continue
  }

  const transaction = await request.cache().helpers.transaction.get()
  const paymentInProgress = transaction?.payment?.payment_id !== undefined
  const mssgs = request.i18n.getCatalog()
  const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
  if (Math.floor(request.response.output.statusCode / 100) === 4) {
    /*
     * 4xx client errors and are not logged
     */
    return h
      .view(CLIENT_ERROR.page, {
        altLang,
        mssgs,
        paymentInProgress,
        referer: request?.headers?.referer,
        clientError: request.response.output.payload,
        path: request.path,
        uri: {
          new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri),
          controller: addLanguageCodeToUri(request, CONTROLLER.uri),
          agreed: addLanguageCodeToUri(request, AGREED.uri),
          ...(transaction?.payment?.href ? { payment: transaction.payment.href } : {})
        }
      })
      .code(request.response.output.statusCode)
  } else {
    /*
     * 5xx server errors and are logged.
     */
    const requestDetail = {
      url: request.url,
      path: request.path,
      query: request.query,
      params: request.params,
      payload: request.payload,
      headers: request.headers,
      state: request.state,
      method: request.method
    }
    console.error('Error processing request. Request: %j, Exception: %o', requestDetail, request.response)

    const serverError = request.response.output.payload

    const prePaymentError = serverError.origin.step === 'pre-payment'
    const postPaymentError = serverError.origin.step === 'post-payment'

    return h
      .view(SERVER_ERROR.page, {
        mssgs,
        altLang,
        prePaymentError,
        postPaymentError,
        uri: {
          new: addLanguageCodeToUri(request, NEW_TRANSACTION.uri),
          agreed: addLanguageCodeToUri(request, AGREED.uri)
        }
      })
      .code(request.response.output.statusCode)
  }
}

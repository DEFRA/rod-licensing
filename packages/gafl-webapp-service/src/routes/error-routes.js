import { CLIENT_ERROR, SERVER_ERROR, NEW_TRANSACTION } from '../uri.js'

export default [
  {
    method: ['GET'],
    path: CLIENT_ERROR.uri,
    handler: async (request, h) => {
      const transaction = await request.cache().helpers.transaction.get()
      const paymentInProgress = transaction?.payment?.payment_id !== undefined
      const clientError = request.response?.output?.payload
      const mssgs = request.i18n.getCatalog()
      const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
      return h.view(CLIENT_ERROR.page, {
        paymentInProgress,
        clientError,
        mssgs,
        altLang,
        uri: {
          new: NEW_TRANSACTION.uri,
          ...(transaction?.payment?.href ? { payment: transaction.payment.href } : {})
        }
      })
    }
  },
  {
    method: ['GET'],
    path: SERVER_ERROR.uri,
    handler: async (request, h) => {
      const transaction = await request.cache().helpers.transaction.get()
      const mssgs = request.i18n.getCatalog()
      const altLang = request.i18n.getLocales().filter(locale => locale !== request.i18n.getLocale())
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

      return h
        .view(SERVER_ERROR.page, {
          mssgs,
          altLang,
          serverError: request.response.output.payload,
          uri: {
            new: NEW_TRANSACTION.uri,
            ...(transaction?.payment?.href ? { payment: transaction.payment.href } : {})
          }
        })
        .code(request.response.output.statusCode)
    }
  }
]

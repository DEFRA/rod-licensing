import { CLIENT_ERROR, NEW_TRANSACTION } from '../uri.js'

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
  }
]

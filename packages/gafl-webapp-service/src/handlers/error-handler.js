import { AGREED, CLIENT_ERROR, CONTROLLER, NEW_TRANSACTION, SERVER_ERROR } from '../uri.js'

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

  if (Math.floor(request.response.output.statusCode / 100) === 4) {
    /*
     * 4xx client errors and are not logged
     */
    return h
      .view(CLIENT_ERROR.page, {
        clientError: request.response.output.payload,
        uri: { new: NEW_TRANSACTION.uri, controller: CONTROLLER.uri }
      })
      .code(request.response.output.statusCode)
  } else {
    /*
     * 5xx server errors and are logged
     */
    console.error(JSON.stringify(request.response, null, 4))

    return h
      .view(SERVER_ERROR.page, {
        serverError: request.response.output.payload,
        uri: { new: NEW_TRANSACTION.uri, agreed: AGREED.uri }
      })
      .code(request.response.output.statusCode)
  }
}

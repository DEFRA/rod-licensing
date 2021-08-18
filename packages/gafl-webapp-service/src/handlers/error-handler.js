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
        path: request.path,
        uri: { new: NEW_TRANSACTION.uri, controller: CONTROLLER.uri, agreed: AGREED.uri }
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

    return h
      .view(SERVER_ERROR.page, {
        serverError: request.response.output.payload,
        uri: { new: NEW_TRANSACTION.uri, agreed: AGREED.uri }
      })
      .code(request.response.output.statusCode)
  }
}

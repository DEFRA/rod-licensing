import { CLIENT_ERROR, SERVER_ERROR, CONTROLLER } from '../uri.js'

export default [
  {
    method: ['GET'],
    path: CLIENT_ERROR.uri,
    handler: async (request, h) => h.view(CLIENT_ERROR.page, { uri: { buy: CONTROLLER.uri } })
  },
  {
    method: ['GET'],
    path: SERVER_ERROR.uri,
    handler: async (request, h) => h.view(SERVER_ERROR.page, { uri: { buy: CONTROLLER.uri } })
  }
]

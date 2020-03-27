import { CONTROLLER } from '../constants.js'

export default [
  {
    method: 'GET',
    path: '/',
    handler: async (request, h) => h.redirect(CONTROLLER.uri)
  }
]

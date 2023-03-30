import { ERROR_TESTING } from '../uri.js'
import errorTestingHandler from '../handlers/error-testing-handler.js'

export default [
  {
    method: 'GET',
    path: ERROR_TESTING.uri,
    handler: errorTestingHandler
  }
]

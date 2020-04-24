import { AGREED } from '../constants.js'
import agreedHandler from '../handlers/agreed-handler.js'

export default {
  method: 'GET',
  path: AGREED.uri,
  handler: agreedHandler
}

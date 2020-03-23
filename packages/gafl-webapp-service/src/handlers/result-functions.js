'use strict'

import dateOfBirth from '../pages/date-of-birth/result-function.js'
import licenceType from '../pages/licence-type/result-function.js'

/**
 * The result function determines the navigation in the route definition
 */
export default {
  'date-of-birth': dateOfBirth,
  'licence-type': licenceType
}

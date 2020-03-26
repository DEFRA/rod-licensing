import dateOfBirth from '../pages/date-of-birth/result-function.js'
import licenceType from '../pages/licence-type/result-function.js'
import licenceToStart from '../pages/licence-to-start/result-function.js'
import licenceStartDate from '../pages/licence-start-date/result-function.js'

/**
 * The result function determines the navigation in the route definition
 */
export default {
  'date-of-birth': dateOfBirth,
  'licence-type': licenceType,
  'licence-to-start': licenceToStart,
  'licence-start-date': licenceStartDate
}

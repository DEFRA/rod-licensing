'use strict'

import * as name from './pages/name/route.js'
import * as dateOfBirth from './pages/date-of-birth/route.js'

const routes = [name, dateOfBirth].map(r => r.default)

export default routes

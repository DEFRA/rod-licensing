'use strict'

import name from './pages/name/route.js'
import dateOfBirth from './pages/date-of-birth/route.js'
import controller from './controller-route.js'

const routes = [controller, ...name, ...dateOfBirth]

export default routes

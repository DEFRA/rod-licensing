'use strict'

import name from './pages/name/route.js'
import dateOfBirth from './pages/date-of-birth/route.js'
import controller from './controller-route.js'
import staticAssets from './static-handler.js'

const routes = [
  controller,
  ...name,
  ...dateOfBirth,
  ...staticAssets]

export default routes

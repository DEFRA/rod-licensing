'use strict'

import handler from './page-handler.js'

export default (view, path, validator) => ([{
  method: 'GET',
  path: path,
  handler: handler(path, view).get
}, {
  method: 'POST',
  path: path,
  handler: handler(path, view).post,
  options: {
    validate: {
      payload: validator,
      failAction: handler(path, view).error
    }
  }
}]
)

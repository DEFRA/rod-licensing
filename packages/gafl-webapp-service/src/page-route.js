'use strict'

import handler from './page-handler.js'

<<<<<<< HEAD
export default (view, path, validator, completion) => [
  {
    method: 'GET',
    path: path,
    handler: handler(path, view, completion).get
  },
  {
    method: 'POST',
    path: path,
    handler: handler(path, view, completion).post,
    options: {
      validate: {
        payload: validator,
        failAction: handler(path, view, completion).error
      }
    }
  }
]
=======
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
>>>>>>> work in progress: generic handlers

'use strict'

import handler from './page-handler.js'

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

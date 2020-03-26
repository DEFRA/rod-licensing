import handler from '../handlers/page-handler.js'

export default (view, path, validator, completion, getData) => [
  {
    method: 'GET',
    path: path,
    handler: handler(path, view, completion, getData).get
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

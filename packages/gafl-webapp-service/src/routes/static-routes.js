/**
 * Handlers to server static assets
 */
export default [
  {
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: 'public'
      }
    }
  },
  {
    method: 'GET',
    path: '/favicon.ico',
    handler: {
      file: {
        path: '/public/images/favicon.ico'
      }
    }
  },
  {
    method: 'GET',
    path: '/robots.txt',
    handler: {
      file: {
        path: 'public/robots.txt'
      }
    }
  }
]

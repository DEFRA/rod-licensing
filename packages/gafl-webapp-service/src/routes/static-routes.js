import Dirname from '../../dirname.cjs'

/**
 * Handlers to server static assets
 */
export default [
  {
    method: 'GET',
    path: '/public/{param*}',
    handler: {
      directory: {
        path: `${Dirname}/public/`
      }
    },
    options: {
      auth: false
    }
  },
  {
    method: 'GET',
    path: '/favicon.ico',
    handler: {
      file: {
        path: `${Dirname}/public/images/favicon.ico`
      }
    },
    options: {
      auth: false
    }
  },
  {
    method: 'GET',
    path: '/robots.txt',
    handler: {
      file: {
        path: `${Dirname}/public/robots.txt`
      }
    },
    options: {
      auth: false
    }
  }
]

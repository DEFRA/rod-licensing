import util from 'util'
import DynamicsWebApi from 'dynamics-web-api'
import AdalNode from 'adal-node'
import db from 'debug'
const debug = db('dynamics:auth')

export function config () {
  if (debug.enabled) {
    AdalNode.Logging.setLoggingOptions({
      log: (level, message, error) => debug(message, error ?? ''),
      level: AdalNode.Logging.LOGGING_LEVEL.VERBOSE,
      loggingWithPII: false
    })
  }

  const authorityUrl = `${process.env.OAUTH_AUTHORITY_HOST_URL}${process.env.OAUTH_TENANT}`
  const adalContext = new AdalNode.AuthenticationContext(authorityUrl)
  const acquireTokenWithClientCredentials = util.promisify(adalContext.acquireTokenWithClientCredentials).bind(adalContext)

  return {
    webApiUrl: process.env.DYNAMICS_API_PATH,
    webApiVersion: process.env.DYNAMICS_API_VERSION,
    timeout: process.env.DYNAMICS_API_TIMEOUT || 90000,
    onTokenRefresh: async dynamicsWebApiCallback =>
      dynamicsWebApiCallback(
        await acquireTokenWithClientCredentials(process.env.OAUTH_RESOURCE, process.env.OAUTH_CLIENT_ID, process.env.OAUTH_CLIENT_SECRET)
      )
  }
}

export const dynamicsClient = new DynamicsWebApi(config())

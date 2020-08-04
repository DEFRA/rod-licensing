import util from 'util'
import DynamicsWebApi from 'dynamics-web-api'
import AdalNode from 'adal-node'
import Bottleneck from 'bottleneck'
import db from 'debug'
const debug = db('dynamics:auth')

/*
Bottleneck is used to prevent more than one request to retrieve a token from being executed concurrently. This is due to a bug in adal-node which
adds multiple cache entries if acquireTokenWithClientCredentials is invoked more than once before the first call returns (asynchronously).
Once this occurs, subsequent calls to the cache always fail as the cache finds more than one candidate to return.  Therefore more entries get added
to the cache and it keeps growing forever.
I have raised an issue with Microsoft here: https://github.com/AzureAD/azure-activedirectory-library-for-nodejs/issues/239
 */
const limiter = new Bottleneck({ maxConcurrent: 1 })

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
  const acquireTokenWithClientCredentials = limiter.wrap(util.promisify(adalContext.acquireTokenWithClientCredentials).bind(adalContext))

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

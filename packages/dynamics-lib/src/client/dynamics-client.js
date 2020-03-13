import util from 'util'
import DynamicsWebApi from 'dynamics-web-api'
import AdalNode from 'adal-node'
const authorityUrl = `${process.env.oauth_authority_host_url}${process.env.oauth_tenant}`
const adalContext = new AdalNode.AuthenticationContext(authorityUrl)
const acquireTokenWithClientCredentials = util.promisify(adalContext.acquireTokenWithClientCredentials).bind(adalContext)

const dynamicsClient = new DynamicsWebApi({
  webApiUrl: process.env.dynamics_api_path,
  webApiVersion: process.env.dynamics_api_version,
  timeout: 60000,
  onTokenRefresh: async dynamicsWebApiCallback =>
    dynamicsWebApiCallback(
      await acquireTokenWithClientCredentials(process.env.oauth_resource, process.env.oauth_client_id, process.env.oauth_client_secret)
    )
})

export { dynamicsClient }

// /**
//  * Retrieve all pages calling onPageCallback for each response.
//  *
//  * @param request as per DynamicsWebApi.retrieveMultipleRequest
//  * @param onPageCallback - called for each page returned
//  * @param maxPages optional - limit the number of pages retrieved
//  * @returns {Promise<void>}
//  */
// module.exports.retrieveAllPages = async function (request, onPageCallback, maxPages = null) {
//   let nextLink = null
//   do {
//     const response = await dynamicsWebApi.retrieveMultipleRequest(request, nextLink)
//     nextLink = response.oDataNextLink
//     onPageCallback(response)
//   } while (nextLink && (maxPages === null || --maxPages > 0))
// }

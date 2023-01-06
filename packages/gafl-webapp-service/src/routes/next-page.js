/**
 * This is the main page controller.
 * It is a state machine
 */
import resultFunctions from '../handlers/result-functions.js'
import updateTransactionFunctions from '../handlers/update-transaction-functions.js'
import journeyDefinition from './journey-definition.js'
import { CommonResults } from '../constants.js'

const defaultResultFunction = () => CommonResults.OK

export const nextPage = async request => {
  const status = await request.cache().helpers.status.getCurrentPermission()

  // Determine the current page
  const currentPage = status.currentPage || 'start'
  const routeNode = journeyDefinition.find(p => p.current.page === currentPage)
  // If the current page has an error then reload it.
  if (!status[status.currentPage] && currentPage !== 'start') {
    return routeNode.current.uri
  }
  // Update the transaction with the validated page details
  if (typeof updateTransactionFunctions[currentPage] === 'function') {
    await updateTransactionFunctions[currentPage](request)
  }

  // Determine the result of the page
  const result = await (resultFunctions[currentPage] || defaultResultFunction)(request)

  // Locate the next page
  return routeNode.next[result].page.uri
}

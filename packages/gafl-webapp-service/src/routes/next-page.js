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
  // Determine the current page
  const currentPage = (await request.cache().helpers.status.getCurrentPermission()).currentPage || 'start'

  // Update the transaction with the validated page details
  if (typeof updateTransactionFunctions[currentPage] === 'function') {
    await updateTransactionFunctions[currentPage](request)
  }

  // Determine the result of the page
  const result = await (resultFunctions[currentPage] || defaultResultFunction)(request)

  // Locate the next page
  const routeNode = journeyDefinition.find(p => p.currentPage === currentPage)
  return routeNode.nextPage[result].page
}

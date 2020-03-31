/**
 * This is the main page controller.
 * It is a state machine
 */
import resultFunctions from './result-functions.js'
import updateTransactionFunctions from './update-transaction-functions.js'
import routeDefinition from './route-definition.js'
const defaultResultFunction = () => 'ok'

export default async (request, h) => {
  // Determine the current page
  const currentPage = (await request.cache().helpers.status.getCurrentPermission()).currentPage || 'start'

  // Update the transaction with the validated page details
  if (typeof updateTransactionFunctions[currentPage] === 'function') {
    try {
      await updateTransactionFunctions[currentPage](request)
    } catch (err) {
      // Test if user has forced a page request in the wrong sequence and the transaction cannot evaluate
      if (err instanceof updateTransactionFunctions.TransactionError) {
        // Nothing too clever here. Get thrown to the start of the journey
        const rn = routeDefinition.find(p => p.currentPage === 'start')
        return h.redirect(rn.nextPage.ok.page)
      } else {
        throw err
      }
    }
  }

  // Determine the result of the page
  const result = await (resultFunctions[currentPage] || defaultResultFunction)(request)

  const routeNode = routeDefinition.find(p => p.currentPage === currentPage)
  return h.redirect(routeNode.nextPage[result].page)
}

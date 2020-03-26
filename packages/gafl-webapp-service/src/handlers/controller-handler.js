/**
 * This is the main page controller.
 * It is a state machine
 */
import resultFunctions from './result-functions.js'
import updateTransactionFunctions from './update-transaction-functions.js'
import transactionHelper from '../lib/transaction-helper.js'
import routeDefinition from './route-definition.js'
import { ADD_PERMISSION } from '../constants.js'
export default async (request, h) => {
  // If there is no permissions then initialize
  if (!(await transactionHelper.hasPermission(request))) {
    return h.redirect(ADD_PERMISSION.uri)
  }

  // Determine the current page
  const currentPage = (await request.cache().get('status')).currentPage || 'start'

  // Update the transaction with the validated page details
  if (typeof updateTransactionFunctions[currentPage] === 'function') {
    try {
      await updateTransactionFunctions[currentPage](request)
    } catch (err) {
      // Test if user has forced a page request in the wrong sequence and the transaction cannot evaluate
      if (err instanceof transactionHelper.TransactionError) {
        // Nothing too clever here. Get thrown to the start of the journey
        const rn = routeDefinition.find(p => p.currentPage === 'start')
        return h.redirect(rn.nextPage.ok.page)
      } else {
        throw err
      }
    }
  }

  // Determine the result of the page
  const defaultResultFunction = () => 'ok'
  const result = await (resultFunctions[currentPage] || defaultResultFunction)(request)

  const routeNode = routeDefinition.find(p => p.currentPage === currentPage)
  return h.redirect(routeNode.nextPage[result].page)
}

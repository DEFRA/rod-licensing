/**
 * This is the main page controller.
 * It is a state machine
 */
import resultFunctions from './result-functions.js'
import updateTransactionFunctions from './update-transaction-functions.js'
import transactionHelper from '../lib/transaction-helper.js'
import routeDefinition from './route-definition.js'

export default async (request, h) => {
  // If there is no transaction then initialize
  if (!(await request.cache().get('status'))) {
    await request.cache().initialize()
  }

  // If there is no permissions then initialize
  if (!(await transactionHelper.hasPermission(request))) {
    return h.redirect('/buy/add')
  }

  // Determine the current page
  const currentPage = (await request.cache().get('status')).currentPage || 'start'

  // Update the transaction with the validated page details
  if (typeof updateTransactionFunctions[currentPage] === 'function') {
    await updateTransactionFunctions[currentPage](request)
  }

  // Determine the result of the page
  const defaultResultFunction = () => 'ok'
  const result = (resultFunctions[currentPage] || defaultResultFunction)(request)

  const routeNode = routeDefinition.find(p => p.currentPage === currentPage)
  return h.redirect(routeNode.nextPage[result].page)
}

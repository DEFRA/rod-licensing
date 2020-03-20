/**
 * This is the default controller
 */

import resultFunctions from './result-functions.js'

const updateTransaction = (request) => {}

export default async (request, h) => {
  // Determine the current page
  const currentPage = (await request.cache().get('status')).currentPage

  const defaultResultFunction = () => 'ok'

  // Determine the result
  const result = (resultFunctions[currentPage] || defaultResultFunction)(request)

  console.log(currentPage)
  console.log(result)

  // Update the transaction details
  await updateTransaction(request)

  return h.redirect('/buy/name')
}

/**
 * This can be thrown by the get data functions to force a redirect.
 * If specific data items necessary to display the page have not been set
 */

export default class GetDataRedirect extends Error {
  constructor (redirectUrl) {
    super()
    this.redirectUrl = redirectUrl
  }
}

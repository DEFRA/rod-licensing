import GetDataRedirect from './src/handlers/get-data-redirect.js'

function toThrowRedirectTo (error, uri) {
  if (error instanceof GetDataRedirect) {
    if (error.redirectUrl === uri) {
      return {
        message: () =>
          `expected ${this.utils.printReceived(error)} to be a GetDataRedirect error with redirectUrl of ${this.utils.printExpected(uri)}`,
        pass: true
      }
    }
    return {
      message: () =>
        `expected ${this.utils.printReceived(error)} to to have redirectUrl of ${this.utils.printExpected(
          uri
        )} and in fact it has ${this.utils.printReceived(error.redirectUrl)}`,
      pass: false
    }
  }
  return {
    message: () => `expected ${this.utils.printReceived(error)} to be of type GetDataRedirect`,
    pass: false
  }
}

function toHaveValidPathFor (location, expectedPath) {
  const regex = new RegExp('^' + expectedPath + '#?$')
  if (location.match(regex)) {
    return {
      message: () =>
        `expected ${this.utils.printReceived(location)} to have the path be formatted as ${this.utils.printReceived(
          expectedPath
        )} or ${this.utils.printReceived(expectedPath + '#')}`,
      pass: true
    }
  }
  return {
    message: () =>
      `expected ${this.utils.printReceived(location)} to have the path be formatted as ${this.utils.printReceived(
        expectedPath
      )} or ${this.utils.printReceived(expectedPath + '#')}`,
    pass: false
  }
}

expect.extend({
  toThrowRedirectTo,
  toHaveValidPathFor
})

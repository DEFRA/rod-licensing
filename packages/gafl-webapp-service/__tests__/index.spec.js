import '../index.js'

jest.mock('../src/server.js', () => {
  // return jest.fn( () => {
  global.initialised = true
  return { createServer: () => {}, init: () => {} }
})

// const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
describe('gafl-web-service', () => {
  it('initialises', () => {
    expect(global.initialised).toBeTruthy()
    // expect(consoleError).toHaveBeenCalled()
  })
})

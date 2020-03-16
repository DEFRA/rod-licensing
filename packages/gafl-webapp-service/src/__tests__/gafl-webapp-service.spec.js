jest.mock('../server.js', () => {
  // return jest.fn( () => {
  global.initialised = true
  return { createServer: () => {}, init: () => {} }
})

// const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
describe('gafl-web-service', () => {
  it('initialises', () => {
    require('../gafl-webapp-service')
    expect(global.initialised).toBeTruthy()
  })
})

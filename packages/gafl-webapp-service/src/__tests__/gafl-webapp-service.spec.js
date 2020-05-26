describe('gafl-web-service', () => {
  it('initialises', () => {
    jest.mock('../server.js', () => {
      // global.initialised = true
      return {
        createServer: () => {},
        init: () => {
          global.initialised = true
          return Promise.resolve()
        }
      }
    })

    require('../gafl-webapp-service')
    expect(global.initialised).toBeTruthy()
  })
})

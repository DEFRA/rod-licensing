describe('gafl-web-service', () => {
  it('initialises', () => {
    jest.isolateModules(() => {
      jest.mock('../server.js', () => {
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
})

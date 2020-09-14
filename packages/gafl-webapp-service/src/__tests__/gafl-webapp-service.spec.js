describe('gafl-web-service', () => {
  it('runs initialisation', () => {
    jest.isolateModules(async () => {
      jest.mock('../server.js')
      const { createServer, init, shutdownBehavior } = require('../server.js')
      createServer.mockImplementation(() => {})
      init.mockImplementation(() => Promise.resolve())
      shutdownBehavior.mockImplementation(() => {})
      await (async () => {
        require('../gafl-webapp-service')
      })()
      expect(createServer).toHaveBeenCalled()
      expect(init).toHaveBeenCalled()
      expect(shutdownBehavior).toHaveBeenCalled()
    })
  })

  it('has initialisation failure', () => {
    jest.isolateModules(async () => {
      jest.mock('../server.js')
      const { createServer, init, shutdownBehavior } = require('../server.js')
      createServer.mockImplementation(() => {})
      init.mockImplementation(() => Promise.reject(new Error()))
      shutdownBehavior.mockImplementation(() => {})
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(code => {})
      await (async () => {
        require('../gafl-webapp-service')
      })().catch()
      expect(init).toHaveBeenCalled()
      expect(createServer).toHaveBeenCalled()
      expect(shutdownBehavior).not.toHaveBeenCalled()
      expect(processExitSpy).toHaveBeenCalledWith(1)
    })
  })
})

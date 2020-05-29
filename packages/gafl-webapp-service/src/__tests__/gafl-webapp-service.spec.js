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

  it('terminates', () => {
    jest.isolateModules(async () => {
      jest.clearAllMocks().mock('../server.js', () => {
        return {
          createServer: () => {},
          init: () => {
            return Promise.reject(new Error())
          }
        }
      })
      const procError = jest.spyOn(process, 'exit').mockImplementation(() => {})
      await (async () => {
        require('../gafl-webapp-service')
      })()
      expect(procError).toHaveBeenCalled()
      procError.mockRestore()
    })
  })
})

describe('gafl-web-service', () => {
  it('terminates', () => {
    jest.clearAllMocks().mock('../server.js', () => {
      // global.initialised = true
      return {
        createServer: () => {},
        init: () => {
          return Promise.reject(new Error())
        }
      }
    })
    const procExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error()
    })
    require('../gafl-webapp-service')
    expect(procExit).toThrow()
  })
})

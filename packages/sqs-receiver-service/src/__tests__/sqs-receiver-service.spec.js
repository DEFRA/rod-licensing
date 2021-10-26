const buildMocks = () => {
  const consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn())
  const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
  jest.mock('@defra-fish/connectors-lib')
  jest.mock('../receiver.js', () => {
    return jest.fn(async () => {
      global.receiverInitialised = true
      if (global.throwReceiverError) {
        throw new Error('Simulated')
      }
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })
  return { consoleError, processExitSpy }
}
describe('sqs-receiver-service', () => {
  beforeEach(jest.clearAllMocks)

  it('executes until encountering an error', done => {
    jest.isolateModules(() => {
      const { consoleError, processExitSpy } = buildMocks()
      const receiver = require('../receiver.js')
      global.throwReceiverError = false
      require('../sqs-receiver-service.js')
      setImmediate(() => {
        expect(receiver).toHaveBeenCalled()
        expect(global.receiverInitialised).toBeTruthy()
        expect(consoleError).not.toHaveBeenCalled()
        expect(processExitSpy).not.toHaveBeenCalled()

        global.throwReceiverError = true
        setTimeout(() => {
          expect(processExitSpy).toHaveBeenCalledWith(1)
          done()
        }, 100)
      })
    })
  })

  describe.each([
    ['SIGINT', 130],
    ['SIGTERM', 137]
  ])('executes until interrupted with the %s signal', (signal, code) => {
    it(`exits the process with code ${code}`, done => {
      jest.isolateModules(() => {
        const { consoleError, processExitSpy } = buildMocks()
        const receiver = require('../receiver.js')
        global.throwReceiverError = false
        require('../sqs-receiver-service.js')
        setImmediate(() => {
          expect(receiver).toHaveBeenCalled()
          expect(global.receiverInitialised).toBeTruthy()
          expect(consoleError).not.toHaveBeenCalled()
          expect(processExitSpy).not.toHaveBeenCalled()

          process.emit(signal)

          setTimeout(() => {
            expect(processExitSpy).toHaveBeenCalledWith(code)
            done()
          }, 100)
        })
      })
    })
  })

  it('logs and errors and exits the process', done => {
    jest.isolateModules(() => {
      const { consoleError, processExitSpy } = buildMocks()
      global.throwReceiverError = true
      require('../sqs-receiver-service.js')
      setImmediate(() => {
        expect(global.receiverInitialised).toBeTruthy()
        expect(consoleError).toHaveBeenCalled()
        expect(processExitSpy).toHaveBeenCalledWith(1)
        done()
      })
    })
  })
})

import receiver from '../receiver.js'
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
const consoleError = jest.spyOn(console, 'error').mockImplementation(jest.fn())
const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(jest.fn())
describe('sqs-receiver-service', () => {
  it('executes until interrupted', done => {
    jest.isolateModules(() => {
      global.throwReceiverError = false
      require('../sqs-receiver-service.js')
      setImmediate(() => {
        expect(receiver).toHaveBeenCalled()
        expect(global.receiverInitialised).toBeTruthy()
        expect(consoleError).not.toHaveBeenCalled()
        expect(processExitSpy).not.toHaveBeenCalled()

        process.emit('SIGINT')

        global.throwReceiverError = true
        setImmediate(() => {
          expect(processExitSpy).not.toHaveBeenCalledWith(0)
          done()
        })
      })
    })
  })
  it('logs and errors and exits the process', done => {
    jest.isolateModules(() => {
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

import '../index.js'
jest.mock('../src/receiver.js', () => {
  return jest.fn(async () => {
    global.receiverInitialised = true
    throw new Error('Simulated')
  })
})
const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
describe('sqs-receiver-service', () => {
  it('initialises', () => {
    expect(global.receiverInitialised).toBeTruthy()
    expect(consoleError).toHaveBeenCalled()
  })
})

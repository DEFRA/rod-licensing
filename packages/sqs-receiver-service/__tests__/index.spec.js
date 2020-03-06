import { receiver } from '../src/receiver'

beforeEach(() => {
  jest.clearAllMocks()
})

afterAll(() => {
  jest.clearAllMocks()
})

test('Call index', async () => {
  jest.mock(receiver)
  const test = () => {
    require('../index')
  }
  expect(() => test()).not.toThrow()
})

test('Call index fails', async () => {
  const mockReceiver = jest.mock(receiver)

  mockReceiver.fn(() => {
    throw new Error()
  })
  const test = () => {
    require('../index')
  }
  expect(() => test()).not.toThrow()
})

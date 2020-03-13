import { start, stop, server } from '../test-utils.js'

beforeAll(d => start(d))
afterAll(d => stop(d))

test('Server is alive', () => {
  expect(server.info).toBeTruthy()
})

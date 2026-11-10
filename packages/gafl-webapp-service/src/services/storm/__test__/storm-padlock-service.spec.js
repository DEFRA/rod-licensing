import { getBearerToken } from '../storm-padlock-service.js'
import db from 'debug'
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:storm-padlock-service')]

jest.mock('debug', () => jest.fn(() => jest.fn()))

describe('storm-padlock-service', () => {
  describe('getBearerToken', () => {
    it('logs out a debug message', async () => {
      getBearerToken()
      expect(debug).toHaveBeenCalledWith('Sure would be great to request a token here!')
    })
  })
})

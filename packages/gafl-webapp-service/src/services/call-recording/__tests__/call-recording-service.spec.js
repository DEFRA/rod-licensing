import db from 'debug'
import { pauseRecording, resumeRecording } from '../call-recording-service'

jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:call-recording-service')]

describe('call-recording-service', () => {
  describe('pauseRecording', () => {
    it('logs that it is requesting to pause the recording', async () => {
      const agent = 'foo'
      await pauseRecording(agent)
      expect(debug).toHaveBeenCalledWith('Sending pause recording request to Storm for agent: %s', agent)
    })
  })
})

describe('call-recording-service', () => {
  describe('resumeRecording', () => {
    it('logs that it is requesting to resume the recording', async () => {
      const agent = 'foo'
      await resumeRecording(agent)
      expect(debug).toHaveBeenCalledWith('Sending resume recording request to Storm for agent: %s', agent)
    })
  })
})

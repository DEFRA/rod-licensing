import soapRequest from 'easy-soap-request'
import db from 'debug'
import { pauseRecording, resumeRecording } from '../call-recording-service'

jest.mock('easy-soap-request')
jest.mock('debug', () => jest.fn(() => jest.fn()))
const { value: debug } = db.mock.results[db.mock.calls.findIndex(c => c[0] === 'webapp:call-recording-service')]

describe('call-recording-service', () => {
  beforeAll(() => {
    process.env.TELESALES_ENDPOINT = 'endpoint'
    process.env.TELESALES_AUTH_USERNAME = 'username'
    process.env.TELESALES_AUTH_PASSWORD = 'password'

    soapRequest.mockReturnValue({
      response: {
        headers: 'headers',
        body: '<soap:Envelope><soap:Body><cal:RecordingResponse><cal:Result>0</cal:Result></cal:RecordingResponse></soap:Body></soap:Envelope>',
        statusCode: '200'
      }
    })
  })
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('pauseRecording', () => {
    it('logs that it is requesting to pause the recording', async () => {
      const agentEmail = 'agent@example.com'
      await pauseRecording(agentEmail)
      expect(debug).toHaveBeenCalledWith('Sending pause recording request to Storm for agentEmail: %s', agentEmail)
    })

    it('sends a soap request', async () => {
      await pauseRecording('agent@example.com')
      const expectedArgs = { url: 'endpoint', headers: { 'Content-Type': 'text/xml;charset=UTF-8' } }
      expect(soapRequest).toHaveBeenCalledWith(expect.objectContaining(expectedArgs))
    })

    it('sends a soap request with the correct xml', async () => {
      await pauseRecording('agent@example.com')
      expect(soapRequest.mock.calls[0][0].xml).toMatchSnapshot()
    })

    it('logs the response code', async () => {
      await pauseRecording('agent@example.com')
      expect(debug).toHaveBeenCalledWith('Pause recording response code: %s', '200')
    })

    it('logs the result', async () => {
      await pauseRecording('agent@example.com')
      expect(debug).toHaveBeenCalledWith('Pause recording response result: %s', 0)
    })
  })

  describe('resumeRecording', () => {
    it('logs that it is requesting to resume the recording', async () => {
      const agentEmail = 'agent@example.com'
      await resumeRecording(agentEmail)
      expect(debug).toHaveBeenCalledWith('Sending resume recording request to Storm for agentEmail: %s', agentEmail)
    })

    it('sends a soap request with the correct headers and endpoint', async () => {
      const expectedArgs = { url: 'endpoint', headers: { 'Content-Type': 'text/xml;charset=UTF-8' } }
      await resumeRecording('agent@example.com')
      expect(soapRequest).toHaveBeenCalledWith(expect.objectContaining(expectedArgs))
    })

    it('sends a soap request with the correct xml', async () => {
      await resumeRecording('agent@example.com')
      expect(soapRequest.mock.calls[0][0].xml).toMatchSnapshot()
    })

    it('logs the response code', async () => {
      await resumeRecording('agent@example.com')
      expect(debug).toHaveBeenCalledWith('Resume recording response code: %s', '200')
    })

    it('logs the result', async () => {
      await resumeRecording('agent@example.com')
      expect(debug).toHaveBeenCalledWith('Resume recording response result: %s', 0)
    })
  })
})
